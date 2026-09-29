import pytest

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