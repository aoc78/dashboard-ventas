from fastapi.testclient import TestClient

from app.main import MAX_FILE_SIZE, app


client = TestClient(app)


def test_analyze_endpoint_accepts_csv():
    response = client.post(
        "/api/sales/analyze",
        files={"file": ("sales.csv", b"fecha,producto,cantidad,precio\n2025-01-01,A,2,10\n", "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["kpis"] == {"ventas_totales": 20, "numero_ventas": 1, "ticket_promedio": 20}


def test_missing_file_is_rejected_by_fastapi():
    response = client.post("/api/sales/analyze")
    assert response.status_code == 400
    assert response.json() == {"error": "El archivo está vacío"}


def test_unsupported_format_returns_415():
    response = client.post("/api/sales/analyze", files={"file": ("sales.xlsx", b"content")})
    assert response.status_code == 415
    assert response.json() == {"error": "Formato no soportado"}


def test_file_over_5_mb_returns_413():
    response = client.post(
        "/api/sales/analyze",
        files={"file": ("sales.csv", b"x" * (MAX_FILE_SIZE + 1), "text/csv")},
    )
    assert response.status_code == 413
    assert response.json() == {"error": "El archivo supera 5 MB"}


def test_empty_csv_returns_400():
    response = client.post("/api/sales/analyze", files={"file": ("sales.csv", b"", "text/csv")})
    assert response.status_code == 400
    assert response.json() == {"error": "El archivo está vacío"}
