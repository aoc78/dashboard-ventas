"""FastAPI application exposing the sales CSV analyzer."""

import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .sales import SalesFileError, analyze_csv


MAX_FILE_SIZE = 5 * 1024 * 1024
app = FastAPI(title="Dashboard de ventas API")
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/")
allowed_origins = ["http://localhost:5173"]
if frontend_origin and frontend_origin != "*":
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/api/sales/analyze")
async def analyze_sales(file: UploadFile | None = File(default=None)) -> JSONResponse:
    if file is None:
        return JSONResponse(status_code=400, content={"error": "El archivo está vacío"})
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        return JSONResponse(status_code=415, content={"error": "Formato no soportado"})
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        return JSONResponse(status_code=413, content={"error": "El archivo supera 5 MB"})
    try:
        result = analyze_csv(content)
    except SalesFileError as exc:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.message})
    return JSONResponse(status_code=200, content=result)
