"""CSV parsing and calculations for sales uploads."""

import csv
import io
import math
from collections import defaultdict
from datetime import date, datetime
from typing import Any


REQUIRED_COLUMNS = ("fecha", "producto", "cantidad", "precio")


class SalesFileError(Exception):
    """A CSV upload that cannot be analyzed according to the API contract."""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def _parse_date(value: str) -> date:
    """Parse an ISO date or datetime and return its calendar date."""
    try:
        return date.fromisoformat(value)
    except ValueError:
        try:
            return datetime.fromisoformat(value).date()
        except ValueError as exc:
            raise ValueError("fecha inválida") from exc


def _parse_nonnegative_number(value: str, field: str) -> float:
    try:
        number = float(value)
    except ValueError as exc:
        raise ValueError(f"{field} no es numérico") from exc
    if not math.isfinite(number):
        raise ValueError(f"{field} no es numérico")
    if number < 0:
        raise ValueError(f"{field} no puede ser negativo")
    return number


def calculate_kpis(valid_rows: list[dict[str, Any]]) -> dict[str, int | float]:
    """Calculate totals from already validated sale rows."""
    total = sum(row["cantidad"] * row["precio"] for row in valid_rows)
    count = len(valid_rows)
    return {
        "ventas_totales": _clean_number(total),
        "numero_ventas": count,
        "ticket_promedio": _clean_number(total / count) if count else 0,
    }


def calculate_sales_by_month(valid_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate sales value by calendar month, in chronological order."""
    totals: dict[str, float] = defaultdict(float)
    for row in valid_rows:
        totals[row["fecha"].strftime("%Y-%m")] += row["cantidad"] * row["precio"]
    return [{"mes": month, "ventas": _clean_number(totals[month])} for month in sorted(totals)]


def calculate_top_products(valid_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return at most five products ranked by sales value, descending."""
    totals: dict[str, float] = defaultdict(float)
    for row in valid_rows:
        totals[row["producto"]] += row["cantidad"] * row["precio"]
    ranked = sorted(totals.items(), key=lambda item: (-item[1], item[0]))[:5]
    return [{"producto": product, "ventas": _clean_number(value)} for product, value in ranked]


def _clean_number(value: float) -> int | float:
    return int(value) if float(value).is_integer() else value


def analyze_csv(content: bytes) -> dict[str, Any]:
    """Validate CSV content and return the documented analysis payload."""
    if not content:
        raise SalesFileError(400, "El archivo está vacío")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise SalesFileError(400, "El archivo CSV debe estar codificado en UTF-8") from exc

    reader = csv.DictReader(io.StringIO(text, newline=""))
    headers = [header.strip() if header else "" for header in (reader.fieldnames or [])]
    if not headers:
        raise SalesFileError(400, "El archivo está vacío")
    for required in REQUIRED_COLUMNS:
        if required not in headers:
            raise SalesFileError(400, f"Falta la columna '{required}'")
    if len(headers) != len(set(headers)):
        raise SalesFileError(400, "El archivo contiene columnas duplicadas")
    reader.fieldnames = headers

    valid_rows: list[dict[str, Any]] = []
    discarded: list[dict[str, Any]] = []
    for row_number, values in enumerate(reader, start=2):
        # DictReader puts extra CSV cells under the None key.
        row = {key: value for key, value in values.items() if key is not None}
        cells = [row.get(header) for header in headers]
        if all(value is None or not value.strip() for value in cells):
            continue
        try:
            if any(row.get(name) is None or not row[name].strip() for name in REQUIRED_COLUMNS):
                raise ValueError("hay celdas vacías")
            parsed_date = _parse_date(row["fecha"].strip())
            product = row["producto"].strip()
            if not product:
                raise ValueError("producto vacío")
            quantity = _parse_nonnegative_number(row["cantidad"].strip(), "cantidad")
            price = _parse_nonnegative_number(row["precio"].strip(), "precio")
            if values.get(None):
                raise ValueError("la fila tiene más columnas de las esperadas")
            valid_rows.append({"fecha": parsed_date, "producto": product, "cantidad": quantity, "precio": price})
        except ValueError as exc:
            discarded.append({"fila": row_number, "motivo": str(exc)})

    return {
        "kpis": calculate_kpis(valid_rows),
        "ventas_por_mes": calculate_sales_by_month(valid_rows),
        "top_productos": calculate_top_products(valid_rows),
        "filas_descartadas": discarded,
    }
