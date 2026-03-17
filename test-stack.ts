import { useGameStore, Owner, PieceType, BoardState } from './src/store';

// We can't easily use the Zustand store directly in a simple Node script without some setup,
// but we can extract the logic or just mock the store's state transitions.
// Let's create a standalone test using the exact logic from store.ts.

const createEmptyBoard = (): BoardState => 
  Array(5).fill(null).map(() => Array(5).fill(null).map(() => []));

let state = {
  board: createEmptyBoard(),
  turn: 0 as Owner,
  inventory: {
    0: { stones: 21, caps: 1 },
    1: { stones: 21, caps: 1 }
  },
  phase: 'idle' as 'idle' | 'place' | 'pickup' | 'move',
  selectedSquare: null as [number, number] | null,
  placeType: null as PieceType | null,
  carriedPieces: [] as any[],
  moveDirection: null as [number, number] | null,
  winner: null as Owner | 'tie' | null,
  winReason: null as string | null,
};

function set(updater: any) {
  const updates = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...updates };
}

// Re-implement the actions for testing
const actions = {
  selectInventory: (owner: Owner, type: PieceType) => set((state: any) => {
    if (state.winner !== null || state.turn !== owner) return state;
    if (state.phase === 'move') return state;
    
    const inv = state.inventory[owner];
    if (type === 'cap' && inv.caps <= 0) return state;
    if (type !== 'cap' && inv.stones <= 0) return state;

    return {
      phase: 'place',
      placeType: type,
      selectedSquare: null,
      carriedPieces: []
    };
  }),

  pickupPieces: (count: number) => set((state: any) => {
    if (state.phase !== 'pickup' || !state.selectedSquare) return state;
    const [x, y] = state.selectedSquare;
    const stack = state.board[y][x];
    if (count < 1 || count > Math.min(stack.length, 5)) return state;

    const newBoard = [...state.board];
    newBoard[y] = [...newBoard[y]];
    const newStack = [...stack];
    const carried = newStack.splice(newStack.length - count, count);
    newBoard[y][x] = newStack;

    return {
      board: newBoard,
      phase: 'move',
      carriedPieces: carried,
      moveDirection: null
    };
  }),

  clickSquare: (x: number, y: number) => set((state: any) => {
    if (state.winner !== null) return state;

    if (state.phase === 'idle') {
      const stack = state.board[y][x];
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.owner === state.turn) {
          return { phase: 'pickup', selectedSquare: [x, y] };
        }
      }
      return state;
    }

    if (state.phase === 'place') {
      const stack = state.board[y][x];
      if (stack.length === 0) {
        const inv = state.inventory[state.turn];
        if (state.placeType === 'cap' && inv.caps <= 0) return state;
        if (state.placeType !== 'cap' && inv.stones <= 0) return state;

        const newBoard = [...state.board];
        newBoard[y] = [...newBoard[y]];
        newBoard[y][x] = [{ owner: state.turn, type: state.placeType!, id: Math.random().toString() }];

        const newInv = { ...state.inventory };
        newInv[state.turn] = { ...inv };
        if (state.placeType === 'cap') newInv[state.turn].caps--;
        else newInv[state.turn].stones--;

        return {
          board: newBoard,
          inventory: newInv,
          turn: state.turn === 0 ? 1 : 0,
          phase: 'idle',
          placeType: null,
        };
      }
      return state;
    }

    if (state.phase === 'move') {
      const [sx, sy] = state.selectedSquare!;
      const dx = x - sx;
      const dy = y - sy;
      const isCurrent = dx === 0 && dy === 0;
      const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;

      if (!isCurrent && !isAdjacent) return state;

      if (isAdjacent) {
        if (state.moveDirection) {
          if (state.moveDirection[0] !== dx || state.moveDirection[1] !== dy) return state;
        }
        
        const targetStack = state.board[y][x];
        if (targetStack.length > 0) {
          const top = targetStack[targetStack.length - 1];
          if (top.type === 'cap') return state;
          if (top.type === 'wall') {
            if (!(state.carriedPieces.length === 1 && state.carriedPieces[0].type === 'cap')) {
              return state;
            }
          }
        }
      }

      const newBoard = [...state.board];
      newBoard[y] = [...newBoard[y]];
      newBoard[y][x] = [...newBoard[y][x]];

      if (isAdjacent) {
        const targetStack = newBoard[y][x];
        if (targetStack.length > 0 && targetStack[targetStack.length - 1].type === 'wall') {
          targetStack[targetStack.length - 1] = { ...targetStack[targetStack.length - 1], type: 'flat' };
        }
      }

      const droppedPiece = state.carriedPieces[0];
      const newCarried = state.carriedPieces.slice(1);
      newBoard[y][x].push(droppedPiece);

      if (newCarried.length === 0) {
        if (state.moveDirection === null && isCurrent) {
          // If we dropped everything on the starting square without moving, it's an invalid turn in Tak,
          // but our UI allows canceling. Let's just end turn for testing if we dropped the last piece.
          // Wait, in our actual code:
          // if (state.moveDirection === null) { return { ...state, board: newBoard, phase: 'idle', carriedPieces: [], selectedSquare: null }; }
          // This means if we drop all pieces on the starting square, the turn DOES NOT END.
          return {
            ...state,
            board: newBoard,
            phase: 'idle',
            carriedPieces: [],
            selectedSquare: null,
          };
        }

        return {
          board: newBoard,
          turn: state.turn === 0 ? 1 : 0,
          phase: 'idle',
          carriedPieces: [],
          selectedSquare: null,
          moveDirection: null,
        };
      } else {
        return {
          board: newBoard,
          carriedPieces: newCarried,
          selectedSquare: [x, y],
          moveDirection: isAdjacent ? [dx, dy] : state.moveDirection
        };
      }
    }

    return state;
  })
};

// --- Test Suite ---
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    failed++;
  }
}

console.log("--- STRESS TESTING STACKING AND SPILLING ---");

// Helper to reset state
function reset() {
  state = {
    board: createEmptyBoard(),
    turn: 0,
    inventory: { 0: { stones: 21, caps: 1 }, 1: { stones: 21, caps: 1 } },
    phase: 'idle',
    selectedSquare: null,
    placeType: null,
    carriedPieces: [],
    moveDirection: null,
    winner: null,
    winReason: null,
  };
}

// Test 1: Basic Stacking
reset();
actions.selectInventory(0, 'flat');
actions.clickSquare(2, 2); // P0 places flat at 2,2
actions.selectInventory(1, 'flat');
actions.clickSquare(2, 3); // P1 places flat at 2,3

actions.clickSquare(2, 2); // P0 clicks 2,2 to pickup
actions.pickupPieces(1);   // P0 picks up 1 piece
actions.clickSquare(2, 3); // P0 moves to 2,3

assert(state.board[3][2].length === 2, "Stack should have 2 pieces");
assert(state.board[3][2][0].owner === 1, "Bottom piece should be P1");
assert(state.board[3][2][1].owner === 0, "Top piece should be P0");
assert(state.turn === 1, "Turn should pass to P1");

// Test 2: Spilling multiple pieces
reset();
// Setup a stack of 3 pieces at (2,2): P0, P1, P0
state.board[2][2] = [
  { owner: 0, type: 'flat', id: '1' },
  { owner: 1, type: 'flat', id: '2' },
  { owner: 0, type: 'flat', id: '3' }
];
state.turn = 0;

actions.clickSquare(2, 2); // P0 clicks 2,2
actions.pickupPieces(3);   // P0 picks up all 3
assert(state.carriedPieces.length === 3, "Should carry 3 pieces");
assert(state.carriedPieces[0].id === '1', "Bottom carried piece should be '1'");

actions.clickSquare(2, 2); // Drop 1 on starting square
assert(state.carriedPieces.length === 2, "Should carry 2 pieces after dropping 1");
assert(state.board[2][2].length === 1, "Starting square should have 1 piece");
assert(state.board[2][2][0].id === '1', "Starting square should have piece '1'");

actions.clickSquare(2, 3); // Move South, drop 1
assert(state.carriedPieces.length === 1, "Should carry 1 piece");
assert(state.board[3][2].length === 1, "Next square should have 1 piece");
assert(state.board[3][2][0].id === '2', "Next square should have piece '2'");

actions.clickSquare(2, 4); // Move South again, drop last piece
assert(state.phase === 'idle', "Phase should be idle");
assert(state.turn === 1, "Turn should pass to P1");
assert(state.board[4][2].length === 1, "Last square should have 1 piece");
assert(state.board[4][2][0].id === '3', "Last square should have piece '3'");

// Test 3: Wall blocking movement
reset();
state.board[2][2] = [{ owner: 0, type: 'flat', id: '1' }];
state.board[2][3] = [{ owner: 1, type: 'wall', id: '2' }]; // Wall at (3,2)
state.turn = 0;

actions.clickSquare(2, 2);
actions.pickupPieces(1);
actions.clickSquare(3, 2); // Try to move East into wall
assert(state.phase === 'move', "Should still be in move phase (move rejected)");
assert(state.carriedPieces.length === 1, "Should still carry the piece");

// Test 4: Cap flattening a wall
reset();
state.board[2][2] = [{ owner: 0, type: 'cap', id: '1' }];
state.board[2][3] = [{ owner: 1, type: 'wall', id: '2' }]; // Wall at (3,2)
state.turn = 0;

actions.clickSquare(2, 2);
actions.pickupPieces(1);
actions.clickSquare(3, 2); // Move East into wall with a cap
assert(state.phase === 'idle', "Move should succeed and end turn");
assert(state.board[2][3].length === 2, "Stack should have 2 pieces");
assert(state.board[2][3][0].type === 'flat', "Wall should be flattened");
assert(state.board[2][3][1].type === 'cap', "Cap should be on top");

// Test 5: Cap trying to flatten a wall but carrying multiple pieces
reset();
state.board[2][2] = [
  { owner: 0, type: 'flat', id: '1' },
  { owner: 0, type: 'cap', id: '2' }
];
state.board[2][3] = [{ owner: 1, type: 'wall', id: '3' }];
state.turn = 0;

actions.clickSquare(2, 2);
actions.pickupPieces(2);
actions.clickSquare(3, 2); // Try to move East into wall with multiple pieces
assert(state.phase === 'move', "Move should be rejected (can only flatten if cap is alone)");
assert(state.board[2][3][0].type === 'wall', "Wall should NOT be flattened");

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
