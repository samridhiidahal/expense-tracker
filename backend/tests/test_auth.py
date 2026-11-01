def test_signup_and_login(client):
    res = client.post(
        "/auth/signup", json={"email": "a@example.com", "password": "password123"}
    )
    assert res.status_code == 201
    assert res.json()["email"] == "a@example.com"
    assert "password" not in res.text

    res = client.post(
        "/auth/login", data={"username": "a@example.com", "password": "password123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "a@example.com"


def test_duplicate_email_rejected(client):
    body = {"email": "a@example.com", "password": "password123"}
    assert client.post("/auth/signup", json=body).status_code == 201
    assert client.post("/auth/signup", json=body).status_code == 400


def test_wrong_password_rejected(client):
    client.post(
        "/auth/signup", json={"email": "a@example.com", "password": "password123"}
    )
    res = client.post(
        "/auth/login", data={"username": "a@example.com", "password": "wrongpass123"}
    )
    assert res.status_code == 401


def test_expenses_require_login(client):
    assert client.get("/expenses/").status_code == 401