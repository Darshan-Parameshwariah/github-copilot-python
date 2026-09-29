// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudokuLeaderboard.v1';
const THEME_KEY = 'sudokuTheme.v1';
const LEADERBOARD_LIMIT = 10;

let puzzle = [];
let validationRequest = 0;
let gameRequest = 0;
let gameStartedAt = null;
let elapsedSeconds = 0;
let timerInterval = null;
let currentDifficulty = 'medium';
let hintCount = 0;
let completedThisGame = false;
let leaderboard = [];


/* ----------------------------- Utility Functions ----------------------------- */

function sanitizeName(value) {
  return Array.from(
    String(value)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .slice(0, 24)
    .join('');
}


function validateLeaderboardEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const name = sanitizeName(entry.name);

  if (
    !name ||
    !Number.isInteger(entry.timeSeconds) ||
    entry.timeSeconds < 0
  ) {
    return null;
  }

  if (!['easy', 'medium', 'hard'].includes(entry.difficulty)) {
    return null;
  }

  if (
    !Number.isInteger(entry.hintsUsed) ||
    entry.hintsUsed < 0
  ) {
    return null;
  }

  return {
    name,
    timeSeconds: entry.timeSeconds,
    difficulty: entry.difficulty,
    hintsUsed: entry.hintsUsed
  };
}


function sortLeaderboard(entries) {
  return entries
    .sort((first, second) => first.timeSeconds - second.timeSeconds)
    .slice(0, LEADERBOARD_LIMIT);
}


function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


/* ----------------------------- Leaderboard ----------------------------- */

function loadLeaderboard() {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    const entries = Array.isArray(parsed)
      ? sortLeaderboard(
          parsed
            .map(validateLeaderboardEntry)
            .filter(Boolean)
        )
      : [];

    if (JSON.stringify(entries) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(
        LEADERBOARD_KEY,
        JSON.stringify(entries)
      );
    }

    return entries;
  } catch {
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, '[]');
    } catch {
      return [];
    }

    return [];
  }
}


function saveLeaderboard() {
  try {
    window.localStorage.setItem(
      LEADERBOARD_KEY,
      JSON.stringify(leaderboard)
    );

    return true;
  } catch {
    return false;
  }
}


function renderLeaderboard() {
  const body = document.getElementById('leaderboard-entries');

  body.replaceChildren();

  if (leaderboard.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    cell.colSpan = 5;
    cell.className = 'empty-leaderboard';
    cell.textContent = 'No completed games yet.';

    row.appendChild(cell);
    body.appendChild(row);

    return;
  }

  leaderboard.forEach((entry, index) => {
    const row = document.createElement('tr');

    const values = [
      String(index + 1),
      entry.name,
      formatTime(entry.timeSeconds),
      entry.difficulty.charAt(0).toUpperCase() +
        entry.difficulty.slice(1),
      String(entry.hintsUsed)
    ];

    values.forEach((value) => {
      const cell = document.createElement('td');

      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
  });
}


function submitScore(event) {
  event.preventDefault();

  const nameInput = document.getElementById('player-name');
  const name = sanitizeName(nameInput.value);
  const message = document.getElementById('message');

  if (!name) {
    setMessageTone(message, 'error');
    message.textContent = 'Enter a name to save your time.';
    nameInput.focus();
    return;
  }

  const entry = validateLeaderboardEntry({
    name,
    timeSeconds: elapsedSeconds,
    difficulty: currentDifficulty,
    hintsUsed: hintCount
  });

  const qualifies =
    leaderboard.length < LEADERBOARD_LIMIT ||
    entry.timeSeconds <=
      leaderboard[leaderboard.length - 1].timeSeconds;

  if (qualifies) {
    leaderboard = sortLeaderboard([
      ...leaderboard,
      entry
    ]);

    renderLeaderboard();
  }

  const stored = qualifies
    ? saveLeaderboard()
    : true;

  document.getElementById('score-form').hidden = true;
  nameInput.value = '';

  setMessageTone(
    message,
    stored ? 'success' : 'error'
  );

  message.textContent = !qualifies
    ? 'Great solve! This time did not make the Top 10.'
    : stored
      ? 'Congratulations! Your time is on the leaderboard.'
      : 'Your time is on this page, but browser storage is unavailable.';
}


/* ----------------------------- Messages & Theme ----------------------------- */

function setMessageTone(message, tone) {
  message.classList.remove(
    'message-error',
    'message-success',
    'message-info'
  );

  if (tone) {
    message.classList.add(`message-${tone}`);
  }
}


function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const toggle = document.getElementById('theme-toggle');

  toggle.setAttribute(
    'aria-pressed',
    String(theme === 'dark')
  );

  toggle.textContent =
    theme === 'dark'
      ? 'Light mode'
      : 'Dark mode';
}


function initializeTheme() {
  let theme;

  try {
    theme = window.localStorage.getItem(THEME_KEY);
  } catch {
    theme = null;
  }

  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }

  applyTheme(theme);

  document
    .getElementById('theme-toggle')
    .addEventListener('click', () => {
      const nextTheme =
        document.documentElement.dataset.theme === 'dark'
          ? 'light'
          : 'dark';

      applyTheme(nextTheme);

      try {
        window.localStorage.setItem(
          THEME_KEY,
          nextTheme
        );
      } catch {
        // Theme switching remains available when browser storage is disabled.
      }
    });
}


/* ----------------------------- Timer ----------------------------- */

function updateTimer() {
  if (gameStartedAt !== null) {
    elapsedSeconds = Math.floor(
      (Date.now() - gameStartedAt) / 1000
    );
  }

  document.getElementById('game-timer').textContent =
    formatTime(elapsedSeconds);
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

  timerInterval = setInterval(
    updateTimer,
    250
  );
}


/* ----------------------------- Sudoku Board ----------------------------- */

function collectBoard(inputs) {
  const board = [];

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];

    for (let j = 0; j < SIZE; j++) {
      const value =
        inputs[i * SIZE + j].value;

      board[i][j] = value
        ? parseInt(value, 10)
        : 0;
    }
  }

  return board;
}


function createBoardElement() {
  const boardDiv =
    document.getElementById('sudoku-board');

  boardDiv.innerHTML = '';

  for (let i = 0; i < SIZE; i++) {
    const rowDiv =
      document.createElement('div');

    rowDiv.className = 'sudoku-row';

    for (let j = 0; j < SIZE; j++) {
      const input =
        document.createElement('input');

      input.type = 'text';
      input.maxLength = 1;
      input.inputMode = 'numeric';
      input.className = 'sudoku-cell';

      input.dataset.row = i;
      input.dataset.col = j;

      input.addEventListener('input', (event) => {
        const value =
          event.target.value.replace(/[^1-9]/g, '');

        event.target.value = value;

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

  const boardDiv =
    document.getElementById('sudoku-board');

  const inputs =
    boardDiv.getElementsByTagName('input');

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const input = inputs[idx];

      if (val !== 0) {
        input.value = val;
        input.disabled = true;
        input.className += ' prefilled';
      } else {
        input.value = '';
        input.disabled = false;
      }
    }
  }
}


/* ----------------------------- New Game ----------------------------- */

async function newGame() {
  const currentGameRequest =
    ++gameRequest;

  validationRequest++;

  stopTimer();

  elapsedSeconds = 0;
  updateTimer();

  const message =
    document.getElementById('message');

  message.textContent = '';

  const difficulty =
    document.getElementById('difficulty').value;

  try {
    const res = await fetch(
      `/new?difficulty=${encodeURIComponent(difficulty)}`
    );

    const data = await res.json();

    if (currentGameRequest !== gameRequest) {
      return;
    }

    if (!res.ok || data.error) {
      throw new Error(
        data.error ||
        'Unable to start a new game.'
      );
    }

    renderPuzzle(data.puzzle);

    currentDifficulty =
      data.difficulty;

    hintCount = 0;
    completedThisGame = false;

    document.getElementById(
      'current-difficulty'
    ).textContent =
      data.difficulty.charAt(0).toUpperCase() +
      data.difficulty.slice(1);

    document.getElementById(
      'score-form'
    ).hidden = true;

    document.getElementById(
      'player-name'
    ).value = '';

    document.getElementById(
      'get-hint'
    ).disabled = false;

    document.getElementById(
      'check-solution'
    ).disabled = false;

    message.textContent = '';

    startTimer();
  } catch {
    if (currentGameRequest !== gameRequest) {
      return;
    }

    setMessageTone(message, 'error');

    message.textContent =
      'Unable to start a new game. Please try again.';
  }
}


/* ----------------------------- Check Solution ----------------------------- */

async function checkSolution(showStatus = true) {
  if (completedThisGame) {
    return;
  }

  const boardDiv =
    document.getElementById('sudoku-board');

  const inputs =
    boardDiv.getElementsByTagName('input');

  const board = collectBoard(inputs);

  const currentRequest =
    ++validationRequest;

  const currentGame =
    gameRequest;

  const res = await fetch('/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ board })
  });

  const data = await res.json();

  if (
    currentRequest !== validationRequest ||
    currentGame !== gameRequest
  ) {
    return;
  }

  const message =
    document.getElementById('message');

  if (data.error) {
    setMessageTone(message, 'error');
    message.innerText = data.error;
    return;
  }

  /*
   * The Flask backend returns the row/column
   * positions that do not match the solution.
   *
   * Empty cells are represented as 0 by
   * collectBoard(), so they are also included
   * in data.incorrect when the puzzle is incomplete.
   */
  const incorrect = new Set(
    data.incorrect.map(
      (position) =>
        position[0] * SIZE + position[1]
    )
  );

  /*
   * Highlight every incorrect OR missing
   * editable cell.
   *
   * Locked/prefilled cells are skipped so
   * their original styling is preserved.
   */
  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];

    if (input.disabled) {
      continue;
    }

    input.classList.toggle(
      'incorrect',
      incorrect.has(idx)
    );
  }

  /*
   * Determine whether any editable cell is
   * currently incorrect or missing.
   */
  const enteredIncorrect =
    Array.from(inputs).some(
      (input, idx) =>
        !input.disabled &&
        incorrect.has(idx)
    );

  if (data.solved) {
    setMessageTone(message, 'success');

    message.innerText =
      'Congratulations! You solved it!';

    completeGame();
  } else if (enteredIncorrect) {
    setMessageTone(message, 'error');

    message.innerText =
      'Some cells are incorrect.';
  } else if (showStatus) {
    setMessageTone(message, 'info');

    message.innerText =
      data.complete
        ? 'Some cells are incorrect.'
        : 'Keep going; the puzzle is not complete yet.';
  } else {
    message.innerText = '';
  }
}


/* ----------------------------- Hint ----------------------------- */

async function getHint() {
  if (completedThisGame) {
    return;
  }

  const currentGame =
    gameRequest;

  const boardDiv =
    document.getElementById('sudoku-board');

  const inputs =
    boardDiv.getElementsByTagName('input');

  const message =
    document.getElementById('message');

  try {
    const res = await fetch('/hint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board: collectBoard(inputs)
      })
    });

    const data = await res.json();

    if (
      currentGame !== gameRequest ||
      completedThisGame
    ) {
      return;
    }

    if (!res.ok || data.error) {
      throw new Error(
        data.error ||
        'Unable to get a hint.'
      );
    }

    const input =
      inputs[data.row * SIZE + data.col];

    hintCount =
      data.hint_count;

    input.value =
      data.value;

    input.disabled = true;

    input.classList.add('hinted');

    await checkSolution(false);

    if (
      !message.textContent ||
      message.textContent ===
        'Keep going; the puzzle is not complete yet.'
    ) {
      message.textContent =
        `Hint used (${data.hint_count}).`;

      setMessageTone(
        message,
        'info'
      );
    }
  } catch (error) {
    setMessageTone(
      message,
      'error'
    );

    message.textContent =
      error.message;
  }
}


/* ----------------------------- Game Completion ----------------------------- */

function completeGame() {
  if (completedThisGame) {
    return;
  }

  completedThisGame = true;

  stopTimer();

  validationRequest++;

  const inputs =
    document
      .getElementById('sudoku-board')
      .getElementsByTagName('input');

  Array.from(inputs).forEach(
    (input) => {
      input.disabled = true;
    }
  );

  document.getElementById(
    'get-hint'
  ).disabled = true;

  document.getElementById(
    'check-solution'
  ).disabled = true;

  document.getElementById(
    'score-form'
  ).hidden = false;

  document.getElementById(
    'player-name'
  ).focus();
}


/* ----------------------------- Initialization ----------------------------- */

initializeTheme();

window.addEventListener('load', () => {
  leaderboard = loadLeaderboard();

  renderLeaderboard();

  document
    .getElementById('score-form')
    .addEventListener(
      'submit',
      submitScore
    );

  document
    .getElementById('new-game')
    .addEventListener(
      'click',
      newGame
    );

  document
    .getElementById('get-hint')
    .addEventListener(
      'click',
      getHint
    );

  document
    .getElementById('check-solution')
    .addEventListener(
      'click',
      checkSolution
    );

  // Start the initial Sudoku game.
  newGame();
});