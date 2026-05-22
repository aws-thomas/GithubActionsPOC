import pytest

from app import app as flask_app


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as client:
        yield client


def test_index_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200


def test_index_contains_display(client):
    response = client.get("/")
    body = response.get_data(as_text=True)
    assert 'id="display"' in body


def test_index_contains_all_digit_buttons(client):
    response = client.get("/")
    body = response.get_data(as_text=True)
    for digit in "0123456789":
        assert f'data-key="{digit}"' in body


def test_index_contains_operator_buttons(client):
    response = client.get("/")
    body = response.get_data(as_text=True)
    for op in ("add", "subtract", "multiply", "divide", "equals"):
        assert f'data-key="{op}"' in body


def test_index_references_calculator_script(client):
    response = client.get("/")
    body = response.get_data(as_text=True)
    assert "calculator.js" in body