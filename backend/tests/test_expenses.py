def make_expense(
    client,
    headers,
    title="Lunch",
    amount=100,
    category="Food",
    expense_date="2026-10-05",
):
    res = client.post(
        "/expenses/",
        json={
            "title": title,
            "amount": amount,
            "category": category,
            "expense_date": expense_date,
        },
        headers=headers,
    )
    assert res.status_code == 201
    return res.json()


def test_create_and_list_expense(client, login):
    headers = login()
    make_expense(client, headers)

    res = client.get("/expenses/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["title"] == "Lunch"


def test_user_cannot_access_other_users_expense(client, login):
    headers_one = login("one@example.com")
    headers_two = login("two@example.com")
    expense = make_expense(client, headers_one)

    assert client.get("/expenses/", headers=headers_two).json() == []
    assert client.get(f"/expenses/{expense['id']}", headers=headers_two).status_code == 404
    assert client.delete(f"/expenses/{expense['id']}", headers=headers_two).status_code == 404


def test_negative_amount_rejected(client, login):
    headers = login()
    res = client.post(
        "/expenses/",
        json={
            "title": "Bad",
            "amount": -5,
            "category": "Food",
            "expense_date": "2026-10-05",
        },
        headers=headers,
    )
    assert res.status_code == 422


def test_filter_by_month_and_category(client, login):
    headers = login()
    make_expense(client, headers, amount=100, category="Food", expense_date="2026-10-05")
    make_expense(client, headers, amount=50, category="Food", expense_date="2026-10-10")
    make_expense(client, headers, amount=30, category="Transport", expense_date="2026-10-12")
    make_expense(client, headers, amount=999, category="Food", expense_date="2026-09-01")

    res = client.get("/expenses/?month=2026-10", headers=headers)
    assert len(res.json()) == 3

    res = client.get("/expenses/?month=2026-10&category=food", headers=headers)
    assert len(res.json()) == 2

    res = client.get("/expenses/?category=Transport", headers=headers)
    assert len(res.json()) == 1

    res = client.get("/expenses/?month=2026-13", headers=headers)
    assert res.status_code == 422


def test_summary_totals(client, login):
    headers = login()
    make_expense(client, headers, amount=100, category="Food", expense_date="2026-10-05")
    make_expense(client, headers, amount=50, category="Food", expense_date="2026-10-10")
    make_expense(client, headers, amount=30, category="Transport", expense_date="2026-10-12")
    make_expense(client, headers, amount=999, category="Food", expense_date="2026-09-01")

    res = client.get("/expenses/summary?month=2026-10", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 180
    assert body["count"] == 3
    assert body["by_category"][0] == {"category": "Food", "total": 150, "count": 2}
    assert body["by_category"][1] == {"category": "Transport", "total": 30, "count": 1}