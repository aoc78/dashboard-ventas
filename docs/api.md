# API: Análisis de ventas

## Endpoint
POST /api/sales/analyze

## Entrada
- Tipo: multipart/form-data
- Campo: `file` (archivo .csv o .xlsx)
- Columnas obligatorias: fecha, producto, cantidad, precio
- Tamaño máximo:  5 MB

## Reglas de cálculo
- Ventas totales = suma de (cantidad × precio) por fila válida
- Número de ventas = cantidad de filas válidas
- Ticket promedio = ventas totales ÷ número de ventas
- Filas con celdas vacías, cantidad o precio negativos, o fecha
  inválida se descartan y se reportan con su motivo
- Si todas las filas se descartan, se responde con código 200, KPIs en cero y listas vacías para las gráficas.
- Las filas completamente vacías se ignoran y no se reportan como errores.
- El número de fila corresponde a la posición original en el archivo, contando la cabecera como fila 1.

## Respuesta correcta (200)
{
  "kpis": {
    "ventas_totales": 0,
    "numero_ventas": 0,
    "ticket_promedio": 0
  },
    "ventas_por_mes": [],
    "top_productos": [],
    "filas_descartadas": [ { "fila": 0, "motivo": "" } ]
}

## Errores
| Código | Cuándo | Ejemplo de mensaje |
|---|---|---|
| 400 | Faltan columnas o el archivo está vacío | {"error": "Falta la columna 'precio'"} |
| 413 | Archivo demasiado grande | {"error": "El archivo supera 5 MB"} |
| 415 | No es CSV ni Excel | {"error": "Formato no soportado"} |


