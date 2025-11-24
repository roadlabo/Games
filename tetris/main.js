// シンプルなテトリス実装。キャンバス描画と最低限のゲームロジックをまとめています。

const COLS = 10;
const ROWS = 20;
const CELL = 30; // 1マスのピクセルサイズ
const DROP_INTERVAL = 800; // 自然落下の間隔（ミリ秒）

// 7種類のテトリミノ定義（1 はブロック、0 は空白）
const TETROMINOES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// ミノの色設定
const COLORS = {
  I: '#0dd6ff',
  O: '#ffef5c',
  T: '#af7cff',
  S: '#6df58c',
  Z: '#ff7082',
  J: '#5c8bff',
  L: '#ffb347',
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const overlay = document.getElementById('overlay');

// ゲーム全体の状態をまとめて保持
const state = {
  board: createBoard(),
  current: null,
  next: null,
  score: 0,
  lines: 0,
  dropTimer: 0,
  lastTime: 0,
  gameOver: false,
};

// 2次元配列で空の盤面を生成
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// ランダムなミノを返す
function randomPiece() {
  const keys = Object.keys(TETROMINOES);
  const name = keys[Math.floor(Math.random() * keys.length)];
  const shape = TETROMINOES[name].map(row => [...row]);
  return { name, shape, row: 0, col: 3 };
}

// 盤面と現在ミノを合わせて描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBoard();
  if (state.current) drawPiece(state.current);
  drawGrid();
}

function drawBackground() {
  ctx.fillStyle = '#0f1420';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 固定済みブロックの描画
function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) {
        drawCell(c, r, COLORS[cell]);
      }
    }
  }
}

// 現在操作中のミノ描画
function drawPiece(piece) {
  const { shape, row, col, name } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawCell(col + c, row + r, COLORS[name]);
      }
    }
  }
}

// 1マスの塗りつぶしと縁取り
function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
}

// 補助用グリッド
function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }
}

// ミノを盤面に固定
function placePiece(piece) {
  piece.shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) {
        const boardRow = piece.row + r;
        const boardCol = piece.col + c;
        state.board[boardRow][boardCol] = piece.name;
      }
    });
  });
}

// 回転（時計回り）
function rotate(matrix) {
  const size = matrix.length;
  const result = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      result[c][size - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

// 位置が合法かどうか確認
function isValidPosition(piece, offsetRow = 0, offsetCol = 0) {
  const { shape, row, col } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const newRow = row + r + offsetRow;
      const newCol = col + c + offsetCol;
      if (
        newCol < 0 ||
        newCol >= COLS ||
        newRow >= ROWS ||
        (newRow >= 0 && state.board[newRow][newCol])
      ) {
        return false;
      }
    }
  }
  return true;
}

// 行消去とスコア加算
function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.board[r].every(cell => cell)) {
      state.board.splice(r, 1);
      state.board.unshift(Array(COLS).fill(null));
      linesCleared++;
      r++; // 同じ行を再確認
    }
  }
  if (linesCleared > 0) {
    state.lines += linesCleared;
    const lineScore = [0, 100, 250, 450, 700];
    state.score += lineScore[linesCleared] || linesCleared * 200;
    updateStats();
  }
}

// 次のミノを描画
function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!state.next) return;
  const { shape, name } = state.next;
  const cell = 20;
  const offsetX = (nextCanvas.width - shape[0].length * cell) / 2;
  const offsetY = (nextCanvas.height - shape.length * cell) / 2;
  nextCtx.fillStyle = '#0f1420';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  nextCtx.strokeRect(0, 0, nextCanvas.width, nextCanvas.height);
  shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) {
        nextCtx.fillStyle = COLORS[name];
        nextCtx.fillRect(offsetX + c * cell, offsetY + r * cell, cell, cell);
        nextCtx.strokeStyle = 'rgba(0,0,0,0.3)';
        nextCtx.strokeRect(offsetX + c * cell, offsetY + r * cell, cell, cell);
      }
    });
  });
}

// スコアとライン表示の更新
function updateStats() {
  scoreEl.textContent = state.score;
  linesEl.textContent = state.lines;
}

// 新しいミノを出現させる
function spawnPiece() {
  state.current = state.next || randomPiece();
  state.current.row = -1; // 1段上から出現させる
  state.current.col = 3;
  state.next = randomPiece();
  drawNext();

  // 出現直後に衝突していたらゲームオーバー
  if (!isValidPosition(state.current)) {
    triggerGameOver();
  }
}

// ゲームを初期化して開始
function resetGame() {
  state.board = createBoard();
  state.score = 0;
  state.lines = 0;
  state.dropTimer = 0;
  state.lastTime = 0;
  state.gameOver = false;
  overlay.classList.remove('show');
  updateStats();
  state.next = randomPiece();
  spawnPiece();
  draw();
}

// 自然落下処理
function dropPiece() {
  if (state.gameOver || !state.current) return;
  if (isValidPosition(state.current, 1, 0)) {
    state.current.row += 1;
  } else {
    // これ以上落ちない場合は固定
    placePiece(state.current);
    clearLines();
    spawnPiece();
  }
  draw();
}

// ハードドロップ（到達できる最下段まで移動）
function hardDrop() {
  if (state.gameOver || !state.current) return;
  while (isValidPosition(state.current, 1, 0)) {
    state.current.row += 1;
  }
  placePiece(state.current);
  clearLines();
  spawnPiece();
  draw();
}

// 移動と回転の入力処理
function handleKeydown(e) {
  if (state.gameOver && e.key.toLowerCase() !== 'r') return;
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      movePiece(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      movePiece(1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      softDrop();
      break;
    case 'ArrowUp':
      e.preventDefault();
      rotatePiece();
      break;
    case ' ': // Space
      e.preventDefault();
      hardDrop();
      break;
    case 'r':
    case 'R':
      resetGame();
      break;
    default:
      break;
  }
}

function movePiece(dir) {
  if (state.gameOver || !state.current) return;
  if (isValidPosition(state.current, 0, dir)) {
    state.current.col += dir;
    draw();
  }
}

function softDrop() {
  if (state.gameOver || !state.current) return;
  if (isValidPosition(state.current, 1, 0)) {
    state.current.row += 1;
  } else {
    placePiece(state.current);
    clearLines();
    spawnPiece();
  }
  draw();
}

function rotatePiece() {
  if (state.gameOver || !state.current) return;
  const rotated = rotate(state.current.shape);
  const originalShape = state.current.shape;
  state.current.shape = rotated;

  // 壁キックとして左右に1マスずらして試行
  const offsets = [0, -1, 1, -2, 2];
  let placed = false;
  for (const offset of offsets) {
    if (isValidPosition(state.current, 0, offset)) {
      state.current.col += offset;
      placed = true;
      break;
    }
  }

  // どこにも入らなければ元に戻す
  if (!placed) {
    state.current.shape = originalShape;
  }
  draw();
}

// ゲームループ。requestAnimationFrame で時間計測しつつ落下させる
function update(timestamp = 0) {
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;
  state.dropTimer += delta;

  if (state.dropTimer > DROP_INTERVAL) {
    dropPiece();
    state.dropTimer = 0;
  }

  requestAnimationFrame(update);
}

function triggerGameOver() {
  state.gameOver = true;
  overlay.innerHTML = '<div>GAME OVER<br>Rキーでリスタート</div>';
  overlay.classList.add('show');
}

// 初期セットアップ
function init() {
  document.addEventListener('keydown', handleKeydown);
  resetGame();
  requestAnimationFrame(update);
}

init();
