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