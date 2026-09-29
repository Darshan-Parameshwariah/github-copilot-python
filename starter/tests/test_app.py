import pytest

import app as app_module
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


def test_index_returns_ok(client):
    response = client.get("/")

    assert response.status_code == 200


def test_new_returns_9_by_9_puzzle(client):
    response = client.get("/new")

    assert response.status_code == 200
    puzzle = response.get_json()["puzzle"]
    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert all(
        type(cell) is int and 0 <= cell <= 9
        for row in puzzle
        for cell in row
    )


def test_new_uses_medium_difficulty_by_default(client, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.sudoku_logic.generate_puzzle",
        lambda difficulty: (calls.append(difficulty) or ([[0] * 9] * 9, None)),
    )

    response = client.get("/new")

    assert response.status_code == 200
    assert calls == ["medium"]


def test_new_accepts_difficulty_query_parameter(client, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.sudoku_logic.generate_puzzle",
        lambda difficulty: (calls.append(difficulty) or ([[0] * 9] * 9, None)),
    )

    response = client.get("/new?difficulty=hard")

    assert response.status_code == 200
    assert calls == ["hard"]


def test_new_rejects_unknown_difficulty(client):
    response = client.get("/new?difficulty=expert")

    assert response.status_code == 400
    assert response.get_json() == {"error": "Unknown difficulty: expert"}


def test_check_reports_incorrect_cells_and_completion(client, monkeypatch):
    solution = [[1] * 9 for _ in range(9)]
    monkeypatch.setitem(app_module.CURRENT, "solution", solution)
    board = [row[:] for row in solution]
    board[0][0] = 0
    board[0][1] = 2

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    assert response.get_json() == {
        "incorrect": [[0, 0], [0, 1]],
        "complete": False,
        "solved": False,
    }


def test_check_detects_a_solved_board(client, monkeypatch):
    solution = [[1] * 9 for _ in range(9)]
    monkeypatch.setitem(app_module.CURRENT, "solution", solution)

    response = client.post("/check", json={"board": solution})

    assert response.status_code == 200
    assert response.get_json() == {
        "incorrect": [],
        "complete": True,
        "solved": True,
    }


@pytest.mark.parametrize("board", [None, [], [[10] * 9 for _ in range(9)]])
def test_check_rejects_invalid_board(client, monkeypatch, board):
    monkeypatch.setitem(app_module.CURRENT, "solution", [[1] * 9 for _ in range(9)])

    response = client.post("/check", json={"board": board})

    assert response.status_code == 400
    assert response.get_json() == {
        "error": "Board must be a 9x9 grid of numbers from 0 to 9"
    }