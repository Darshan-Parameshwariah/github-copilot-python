import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def count_solutions(board, limit=2):
    if limit <= 0:
        return 0

    for row in range(SIZE):
        for col in range(SIZE):
            value = board[row][col]
            if value == EMPTY:
                continue
            if not 1 <= value <= SIZE:
                return 0
            board[row][col] = EMPTY
            valid = is_safe(board, row, col, value)
            board[row][col] = value
            if not valid:
                return 0

    def search():
        best_cell = None
        best_candidates = None

        for row in range(SIZE):
            for col in range(SIZE):
                if board[row][col] != EMPTY:
                    continue

                candidates = [
                    num for num in range(1, SIZE + 1)
                    if is_safe(board, row, col, num)
                ]
                if not candidates:
                    return 0
                if best_candidates is None or len(candidates) < len(best_candidates):
                    best_cell = (row, col)
                    best_candidates = candidates
                    if len(candidates) == 1:
                        break
            if best_candidates is not None and len(best_candidates) == 1:
                break

        if best_cell is None:
            return 1

        row, col = best_cell
        solutions = 0
        for candidate in best_candidates:
            board[row][col] = candidate
            solutions += search()
            board[row][col] = EMPTY
            if solutions >= limit:
                return solutions
        return solutions

    return search()

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def remove_cells(board, clues):
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)
    clue_count = sum(cell != EMPTY for row in board for cell in row)

    for row, col in cells:
        if clue_count <= clues:
            break
        value = board[row][col]
        if value == EMPTY:
            continue

        board[row][col] = EMPTY
        if count_solutions(board) == 1:
            clue_count -= 1
        else:
            board[row][col] = value

    return clue_count

def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
