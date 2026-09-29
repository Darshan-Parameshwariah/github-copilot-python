import sudoku_logic


SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
]


def test_count_solutions_stops_at_limit():
    assert sudoku_logic.count_solutions(sudoku_logic.create_empty_board()) == 2


def test_count_solutions_returns_one_for_completed_board():
    assert sudoku_logic.count_solutions(SOLUTION) == 1


def test_count_solutions_returns_zero_for_invalid_board():
    board = sudoku_logic.deep_copy(SOLUTION)
    board[0][0] = board[0][1]

    assert sudoku_logic.count_solutions(board) == 0


def test_remove_cells_preserves_unique_solution_and_returns_actual_count(monkeypatch):
    board = sudoku_logic.deep_copy(SOLUTION)
    monkeypatch.setattr(sudoku_logic.random, "shuffle", lambda cells: None)

    clue_count = sudoku_logic.remove_cells(board, clues=0)

    assert clue_count == sum(cell != 0 for row in board for cell in row)
    assert clue_count > 0
    assert sudoku_logic.count_solutions(board) == 1