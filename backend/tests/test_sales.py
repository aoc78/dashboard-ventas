import csv
from datetime import date
from io import StringIO
from pathlib import Path

import pytest

from app.sales import (
    SalesFileError,
    analyze_csv,
    calculate_kpis,
    calculate_sales_by_month,
    calculate_top_products,
)


ROOT = Path(__file__).resolve().parents[2]


def row(day, product, quantity, price):
    return {"fecha": date.fromisoformat(day), "producto": product, "cantidad": quantity, "precio": price}


def test_calculate_kpis():
    assert calculate_kpis([row("2025-01-01", "A", 2, 10), row("2025-01-02", "B", 1, 5)]) == {
        "ventas_totales": 25,
        "numero_ventas": 2,
        "ticket_promedio": 12.5,
    }


def test_calculate_kpis_empty():
    assert calculate_kpis([]) == {"ventas_totales": 0, "numero_ventas": 0, "ticket_promedio": 0}


def test_calculate_sales_by_month():
    rows = [row("2025-02-02", "A", 2, 10), row("2025-01-02", "A", 1, 5)]
    assert calculate_sales_by_month(rows) == [{"mes": "2025-01", "ventas": 5}, {"mes": "2025-02", "ventas": 20}]


def test_calculate_top_products_ranks_sales_and_limits_to_five():
    rows = [row("2025-01-01", f"P{i}", 1, i) for i in range(1, 7)]
    assert calculate_top_products(rows) == [
        {"producto": "P6", "ventas": 6}, {"producto": "P5", "ventas": 5},
        {"producto": "P4", "ventas": 4}, {"producto": "P3", "ventas": 3},
        {"producto": "P2", "ventas": 2},
    ]


def test_example_csv_matches_reference_values():
    result = analyze_csv((ROOT / "data" / "ventas_ejemplo.csv").read_bytes())
    assert result["kpis"] == {"ventas_totales": 41122000, "numero_ventas": 400, "ticket_promedio": 102805}
    assert result["filas_descartadas"] == []


def test_invalid_rows_are_reported_with_original_line_numbers():
    content = (
        "fecha,producto,cantidad,precio\n"
        "2025-01-01,A,1,10\n"
        "2025-99-99,B,1,10\n"
        "2025-01-03,C,-1,10\n"
        "2025-01-04,D,1,-10\n"
        "2025-01-05,,1,10\n"
        ",,,\n"
    ).encode()
    result = analyze_csv(content)
    assert result["kpis"] == {"ventas_totales": 10, "numero_ventas": 1, "ticket_promedio": 10}
    assert [item["fila"] for item in result["filas_descartadas"]] == [3, 4, 5, 6]
    assert [item["motivo"] for item in result["filas_descartadas"]] == [
        "fecha inválida", "cantidad no puede ser negativo", "precio no puede ser negativo", "hay celdas vacías"
    ]


def test_all_rows_discarded_returns_zero_metrics_and_empty_charts():
    result = analyze_csv(b"fecha,producto,cantidad,precio\ninvalid,A,1,10\n")
    assert result["kpis"] == {"ventas_totales": 0, "numero_ventas": 0, "ticket_promedio": 0}
    assert result["ventas_por_mes"] == []
    assert result["top_productos"] == []


@pytest.mark.parametrize(
    ("content", "message"),
    [(b"", "El archivo está vacío"), (b"fecha,producto,cantidad\n", "Falta la columna 'precio'")],
)
def test_csv_header_errors(content, message):
    with pytest.raises(SalesFileError, match=message):
        analyze_csv(content)


def test_extra_csv_cells_are_discarded():
    result = analyze_csv(b"fecha,producto,cantidad,precio\n2025-01-01,A,1,10,extra\n")
    assert result["kpis"]["numero_ventas"] == 0
    assert result["filas_descartadas"] == [{"fila": 2, "motivo": "la fila tiene más columnas de las esperadas"}]
