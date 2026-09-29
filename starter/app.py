
from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None,
    'difficulty': None,
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', 'medium')
    if difficulty not in sudoku_logic.DIFFICULTY_CLUES:
        return jsonify({'error': f'Unknown difficulty: {difficulty}'}), 400

    puzzle, solution = sudoku_logic.generate_puzzle(difficulty)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    CURRENT['difficulty'] = difficulty
    return jsonify({'puzzle': puzzle, 'difficulty': difficulty})

@app.route('/check', methods=['POST'])
def check_solution():
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    data = request.get_json(silent=True)
    board = data.get('board') if isinstance(data, dict) else None
    if (
        not isinstance(board, list)
        or len(board) != sudoku_logic.SIZE
        or any(not isinstance(row, list) or len(row) != sudoku_logic.SIZE for row in board)
        or any(
            type(cell) is not int or not 0 <= cell <= sudoku_logic.SIZE
            for row in board
            for cell in row
        )
    ):
        return jsonify({'error': 'Board must be a 9x9 grid of numbers from 0 to 9'}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    complete = all(cell != sudoku_logic.EMPTY for row in board for cell in row)
    return jsonify({
        'incorrect': incorrect,
        'complete': complete,
        'solved': complete and not incorrect,
    })

if __name__ == '__main__':
    app.run(debug=True)