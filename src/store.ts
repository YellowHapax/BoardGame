import { create } from 'zustand';

export const COLOR_PAIRS = [
  ['#ff6600', '#0099ff'], // Flame & Tide
  ['#ff3380', '#33ff4d'], // Blossom & Grove
  ['#fff200', '#8000ff'], // Solar & Void
  ['#00ffe6', '#ff0080'], // Frost & Ember
  ['#ff7359', '#00ccb3'], // Coral & Deep
  ['#ff0099', '#00ff80'], // Rose & Mint
  ['#ff8000', '#4d00ff'], // Tangerine & Indigo
  ['#00ffff', '#ff00ff'], // Cyan & Magenta
  ['#b3ff00', '#ff1a80'], // Lime & Hot Pink
  ['#e61a1a', '#1a9933'], // Christmas
  ['#ff8000', '#9900cc'], // Halloween
  ['#ffd94d', '#bfbfc0']  // Gold & Silver
];

export const PALETTE_NAMES = [
  "Flame & Tide", "Blossom & Grove", "Solar & Void", "Frost & Ember",
  "Coral & Deep", "Rose & Mint", "Tangerine & Indigo", "Cyan & Magenta",
  "Lime & Hot Pink", "Christmas", "Halloween", "Gold & Silver"
];

export type PieceType = 'flat' | 'wall' | 'cap';
export type Owner = 0 | 1;

export interface Piece {
  owner: Owner;
  type: PieceType;
  id: string;
}

export type BoardState = Piece[][][];

interface GameState {
  board: BoardState;
  turn: Owner;
  inventory: {
    [key in Owner]: { stones: number; caps: number };
  };
  phase: 'idle' | 'place' | 'pickup' | 'move';
  selectedSquare: [number, number] | null;
  placeType: PieceType | null;
  carriedPieces: Piece[];
  moveDirection: [number, number] | null;
  winner: Owner | 'tie' | null;
  winReason: string | null;
  paletteIndex: number;
  
  setPalette: (index: number) => void;
  selectInventory: (owner: Owner, type: PieceType) => void;
  clickSquare: (x: number, y: number) => void;
  pickupPieces: (count: number) => void;
  cancelAction: () => void;
  resetGame: () => void;
}

const createEmptyBoard = (): BoardState => 
  Array(5).fill(null).map(() => Array(5).fill(null).map(() => []));

const checkRoadWin = (board: BoardState, owner: Owner): boolean => {
  const size = 5;
  const isRoad = (x: number, y: number) => {
    const stack = board[y][x];
    if (stack.length === 0) return false;
    const top = stack[stack.length - 1];
    return top.owner === owner && (top.type === 'flat' || top.type === 'cap');
  };

  // Check N-S
  let visited = new Set<string>();
  let queue: [number, number][] = [];
  for (let x = 0; x < size; x++) {
    if (isRoad(x, 0)) {
      queue.push([x, 0]);
      visited.add(`${x},0`);
    }
  }
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    if (y === size - 1) return true;
    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited.has(`${nx},${ny}`) && isRoad(nx, ny)) {
        visited.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
  }

  // Check E-W
  visited = new Set<string>();
  queue = [];
  for (let y = 0; y < size; y++) {
    if (isRoad(0, y)) {
      queue.push([0, y]);
      visited.add(`0,${y}`);
    }
  }
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    if (x === size - 1) return true;
    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited.has(`${nx},${ny}`) && isRoad(nx, ny)) {
        visited.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
  }

  return false;
};

const checkFlatWin = (board: BoardState) => {
  let isFull = true;
  let counts: [number, number] = [0, 0];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const stack = board[y][x];
      if (stack.length === 0) {
        isFull = false;
      } else {
        const top = stack[stack.length - 1];
        if (top.type === 'flat') {
          counts[top.owner]++;
        }
      }
    }
  }
  if (!isFull) return { isFull: false, winner: null, counts };
  if (counts[0] > counts[1]) return { isFull: true, winner: 0 as Owner, counts };
  if (counts[1] > counts[0]) return { isFull: true, winner: 1 as Owner, counts };
  return { isFull: true, winner: 'tie' as const, counts };
};

const checkWin = (board: BoardState, activePlayer: Owner) => {
  if (checkRoadWin(board, activePlayer)) return { winner: activePlayer, reason: 'Road Win' };
  const inactivePlayer = activePlayer === 0 ? 1 : 0;
  if (checkRoadWin(board, inactivePlayer)) return { winner: inactivePlayer, reason: 'Road Win' };

  const { isFull, winner, counts } = checkFlatWin(board);
  if (isFull) {
    return { winner, reason: `Flat Win (${counts[0]} vs ${counts[1]})` };
  }

  return { winner: null, reason: null };
};

export const useGameStore = create<GameState>((set) => ({
  board: createEmptyBoard(),
  turn: 0,
  inventory: {
    0: { stones: 21, caps: 1 },
    1: { stones: 21, caps: 1 }
  },
  phase: 'idle',
  selectedSquare: null,
  placeType: null,
  carriedPieces: [],
  moveDirection: null,
  winner: null,
  winReason: null,
  paletteIndex: 0,

  setPalette: (index) => set({ paletteIndex: index }),

  resetGame: () => set({
    board: createEmptyBoard(),
    turn: 0,
    inventory: { 0: { stones: 21, caps: 1 }, 1: { stones: 21, caps: 1 } },
    phase: 'idle',
    selectedSquare: null,
    placeType: null,
    carriedPieces: [],
    moveDirection: null,
    winner: null,
    winReason: null
  }),

  selectInventory: (owner, type) => set((state) => {
    if (state.winner !== null || state.turn !== owner) return state;
    if (state.phase === 'move') return state; // Cannot change during move
    
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

  pickupPieces: (count) => set((state) => {
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

  cancelAction: () => set((state) => {
    if (state.phase === 'place') {
      return { phase: 'idle', placeType: null };
    }
    if (state.phase === 'pickup') {
      return { phase: 'idle', selectedSquare: null };
    }
    if (state.phase === 'move' && state.moveDirection === null) {
      const [x, y] = state.selectedSquare!;
      const newBoard = [...state.board];
      newBoard[y] = [...newBoard[y]];
      newBoard[y][x] = [...newBoard[y][x], ...state.carriedPieces];
      return { phase: 'idle', selectedSquare: null, carriedPieces: [], board: newBoard };
    }
    return state;
  }),

  clickSquare: (x, y) => set((state) => {
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

        const { winner, reason } = checkWin(newBoard, state.turn);

        return {
          board: newBoard,
          inventory: newInv,
          turn: state.turn === 0 ? 1 : 0,
          phase: 'idle',
          placeType: null,
          winner,
          winReason: reason
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
        if (state.moveDirection === null) {
          return {
            ...state,
            board: newBoard,
            phase: 'idle',
            carriedPieces: [],
            selectedSquare: null,
          };
        }

        const { winner, reason } = checkWin(newBoard, state.turn);
        return {
          board: newBoard,
          turn: state.turn === 0 ? 1 : 0,
          phase: 'idle',
          carriedPieces: [],
          selectedSquare: null,
          moveDirection: null,
          winner,
          winReason: reason
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
}));
