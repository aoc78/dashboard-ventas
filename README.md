# Dashboard de ventas

Aplicación web para analizar un archivo de ventas y consultar sus indicadores principales desde un panel responsive. El proyecto procesa cada archivo durante la solicitud y no guarda los resultados en una base de datos.

## Problema que resuelve

Los negocios que registran sus ventas en hojas de cálculo necesitan una forma rápida de entender sus resultados. El dashboard calcula ventas totales, número de ventas y ticket promedio, además de mostrar ventas por mes y los cinco productos con mayor valor vendido.

## Funcionalidades implementadas

- Interfaz responsive para seleccionar o arrastrar un archivo de ventas.
- API `POST /api/sales/analyze` que recibe el archivo en el campo `file` como `multipart/form-data`.
- Cálculo de los tres KPI, agregación mensual y ranking de productos.
- Reporte de las filas descartadas y sus motivos; las filas completamente vacías se ignoran.
- Estados de carga, errores y visualizaciones con Recharts. No se muestran resultados hasta analizar un archivo.

## Captura de pantalla

> **Captura pendiente:** espacio reservado para añadir una imagen real del dashboard.

## Tecnologías

- **Frontend:** React, Vite y Recharts.
- **Backend:** Python y FastAPI; Uvicorn sirve la API.
- **Pruebas:** pytest y HTTPX.
- **Datos:** se procesan en memoria; no hay base de datos.

## Requisitos

- Windows con Python 3.10 o posterior.
- Node.js 20.19 o posterior, o 22.12 o posterior, y npm. Son las versiones compatibles con Vite fijado en este proyecto.

## Ejecutar en Windows

Abre dos ventanas de CMD, una para cada servicio.

### Backend

En la primera ventana:

```bat
cd backend
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000`; la documentación interactiva de FastAPI está en `http://127.0.0.1:8000/docs`.

### Frontend

En la segunda ventana:

```bat
cd frontend
npm install
npm run dev
```

Abre en el navegador la dirección local que indique Vite, normalmente `http://localhost:5173`. En desarrollo, Vite reenvía las solicitudes `/api` al backend. El destino predeterminado es `http://127.0.0.1:8000` y se puede cambiar con `VITE_API_URL`.

## Pruebas del backend

Con el entorno virtual del backend activado, desde `backend/` ejecuta:

```bat
python -m pytest -v
```

Las pruebas cubren los cálculos, la validación de filas, los errores del endpoint y los valores de referencia de `data/ventas_ejemplo.csv`.

## Formatos y limitaciones actuales

- La API procesa archivos `.csv` codificados en UTF-8, con o sin BOM, de hasta 5 MB.
- El CSV debe incluir las columnas `fecha`, `producto`, `cantidad` y `precio`.
- Las filas con datos vacíos, fechas inválidas, cantidades o precios negativos o no numéricos se descartan y se reportan. Si no quedan filas válidas, la API responde con KPI en cero y listas de gráficas vacías.
- La interfaz permite seleccionar `.csv` y `.xlsx`, pero el backend actual todavía no procesa Excel: una carga `.xlsx` recibe el error HTTP 415 `Formato no soportado`.
- Los errores principales de la API usan HTTP 400 para archivos vacíos o encabezados inválidos, 413 para archivos mayores de 5 MB y 415 para formatos no soportados.

## Estructura principal

```text
backend/
  app/
    main.py          # Aplicación FastAPI y endpoint de análisis
    sales.py         # Validación del CSV y cálculos
  tests/             # Pruebas de cálculos y API
  requirements.txt
frontend/
  src/
    App.jsx          # Dashboard e integración con la API
    main.jsx         # Entrada de React
    styles.css       # Estilos responsive
  package.json
  vite.config.js     # Servidor de desarrollo y proxy de la API
data/                # Archivos de ejemplo
docs/                # Brief, arquitectura, API y reglas del proyecto
```
