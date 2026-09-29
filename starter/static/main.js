// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let validationRequest = 0;
let gameRequest = 0;
let gameStartedAt = null;
let elapsedSeconds = 0;
let timerInterval = null;

function updateTimer() {
  if (gameStartedAt !== null) {
    elapsedSeconds = Math.floor((Date.now() - gameStartedAt) / 1000);
  }
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('game-timer').textContent = formatted;
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  updateTimer();
  gameStartedAt = null;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  gameStartedAt = Date.now();
  updateTimer();
  timerInterval = setInterval(updateTimer, 250);
}

function collectBoard(inputs) {
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const value = inputs[i * SIZE + j].value;
      board[i][j] = value ? parseInt(value, 10) : 0;
    }
  }
  return board;
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.inputMode = 'numeric';
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        checkSolution(false);
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  const currentGameRequest = ++gameRequest;
  validationRequest++;
  stopTimer();
  elapsedSeconds = 0;
  updateTimer();
  const message = document.getElementById('message');
  message.textContent = '';
  const difficulty = document.getElementById('difficulty').value;
  try {
    const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
    const data = await res.json();
    if (currentGameRequest !== gameRequest) return;
    if (!res.ok || data.error) throw new Error(data.error || 'Unable to start a new game.');
    renderPuzzle(data.puzzle);
    document.getElementById('current-difficulty').textContent =
      data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);
    message.textContent = '';
    startTimer();
  } catch {
    if (currentGameRequest !== gameRequest) return;
    message.style.color = '#b42318';
    message.textContent = 'Unable to start a new game. Please try again.';
  }
}

async function checkSolution(showStatus = true, stopClock = true) {
  if (stopClock) stopTimer();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = collectBoard(inputs);
  const currentRequest = ++validationRequest;
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (currentRequest !== validationRequest) return;
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.classList.toggle('incorrect', Boolean(inp.value) && incorrect.has(idx));
  }
  const enteredIncorrect = Array.from(inputs).some((input, idx) =>
    !input.disabled && input.value && incorrect.has(idx)
  );
  if (data.solved) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  } else if (enteredIncorrect) {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  } else if (showStatus) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.complete ? 'Some cells are incorrect.' : 'Keep going; the puzzle is not complete yet.';
  } else {
    msg.innerText = '';
  }
}

async function getHint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const message = document.getElementById('message');
  try {
    const res = await fetch('/hint', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({board: collectBoard(inputs)})
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Unable to get a hint.');

    const input = inputs[data.row * SIZE + data.col];
    input.value = data.value;
    input.disabled = true;
    input.classList.add('hinted');
    await checkSolution(false, false);
    if (!message.textContent || message.textContent === 'Keep going; the puzzle is not complete yet.') {
      message.textContent = `Hint used (${data.hint_count}).`;
      message.style.color = '#126b5b';
    }
  } catch (error) {
    message.style.color = '#b42318';
    message.textContent = error.message;
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('get-hint').addEventListener('click', getHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  // initialize
  newGame();
});