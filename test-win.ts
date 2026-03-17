import { Piece, BoardState, Owner } from './src/store';

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

// Helper to place a piece
function place(board: BoardState, x: number, y: number, owner: Owner, type: 'flat' | 'wall' | 'cap') {
  board[y][x].push({ owner, type, id: Math.random().toString() });
}

console.log("--- STRESS TESTING ROAD WIN CONDITIONS ---");

// Test 1: Empty board
let b1 = createEmptyBoard();
assert(checkRoadWin(b1, 0) === false, "Empty board should not win");

// Test 2: Straight line N-S (Flats)
let b2 = createEmptyBoard();
for (let y = 0; y < 5; y++) place(b2, 2, y, 0, 'flat');
assert(checkRoadWin(b2, 0) === true, "Straight N-S line of flats should win");

// Test 3: Straight line N-S but one is a WALL
let b3 = createEmptyBoard();
for (let y = 0; y < 5; y++) place(b3, 2, y, 0, y === 2 ? 'wall' : 'flat');
assert(checkRoadWin(b3, 0) === false, "Straight N-S line with a WALL blocking it should NOT win");

// Test 4: Straight line N-S but one is a CAP
let b4 = createEmptyBoard();
for (let y = 0; y < 5; y++) place(b4, 2, y, 0, y === 2 ? 'cap' : 'flat');
assert(checkRoadWin(b4, 0) === true, "Straight N-S line with a CAP should win");

// Test 5: Snake path E-W
let b5 = createEmptyBoard();
place(b5, 0, 0, 1, 'flat');
place(b5, 1, 0, 1, 'flat');
place(b5, 1, 1, 1, 'flat');
place(b5, 2, 1, 1, 'flat');
place(b5, 2, 2, 1, 'flat');
place(b5, 3, 2, 1, 'flat');
place(b5, 3, 3, 1, 'flat');
place(b5, 4, 3, 1, 'flat');
assert(checkRoadWin(b5, 1) === true, "Snake path E-W of flats should win");

// Test 6: Snake path E-W blocked by opponent piece
let b6 = createEmptyBoard();
place(b6, 0, 0, 1, 'flat');
place(b6, 1, 0, 1, 'flat');
place(b6, 1, 1, 1, 'flat');
place(b6, 2, 1, 0, 'flat'); // Opponent piece blocks the path
place(b6, 2, 2, 1, 'flat');
place(b6, 3, 2, 1, 'flat');
place(b6, 3, 3, 1, 'flat');
place(b6, 4, 3, 1, 'flat');
assert(checkRoadWin(b6, 1) === false, "Path blocked by opponent piece should NOT win");

// Test 7: Path where a wall is covered by a cap (wait, walls can't be covered by caps in standard Tak without flattening, but if a cap is on top, it counts)
let b7 = createEmptyBoard();
for (let y = 0; y < 5; y++) place(b7, 2, y, 0, 'flat');
// On square (2,2), we have a wall, but then a cap is placed on top (flattening it in actual gameplay, but let's simulate the stack)
b7[2][2] = []; // clear
place(b7, 2, 2, 0, 'wall'); // bottom is wall
place(b7, 2, 2, 0, 'cap');  // top is cap
assert(checkRoadWin(b7, 0) === true, "Path with a cap on top of a stack should win");

// Test 8: Diagonal path (should NOT win)
let b8 = createEmptyBoard();
for (let i = 0; i < 5; i++) place(b8, i, i, 0, 'flat');
assert(checkRoadWin(b8, 0) === false, "Diagonal path should NOT win (must be orthogonal)");

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
