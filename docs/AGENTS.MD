# Proyecto: Dashboard de ventas

## Qué es
Aplicación web donde el usuario sube un archivo CSV o Excel de ventas
y ve KPIs y gráficas. Es un proyecto freelance de demostración.

## Documentos de referencia (léelos antes de programar)
- docs/BRIEF.md: qué incluye y qué no incluye el proyecto
- docs/arquitectura.md: decisiones técnicas
- docs/api.md: contrato del endpoint (entrada, salida y errores)

## Tecnologías
- Backend: Python, FastAPI, pandas, openpyxl, pytest
- Frontend: React con Vite y Recharts
- Sin base de datos. Los datos se procesan en memoria.

## Estructura
- backend/  código del servidor y sus pruebas
- frontend/ interfaz de usuario
- data/     archivos de ejemplo para pruebas
- docs/     documentación

## Reglas de trabajo
1. Haz UNA tarea por vez y explícame en máximo 5 líneas qué hiciste.
2. No cambies el contrato de docs/api.md. Si crees que debe cambiar,
   pregúntame antes.
3. Escribe pruebas con pytest para cada función de cálculo.
4. Después de cambiar algo, ejecuta las pruebas y dime el resultado.
5. Si algo no está claro en el brief, pregúntame; no inventes.
6. Explica en lenguaje simple las decisiones importantes, porque
   estoy aprendiendo el flujo de trabajo.

## Qué NO hacer
- No agregues librerías sin preguntarme.
- No agregues base de datos, login, Docker ni funciones fuera del alcance.
- No pongas claves ni contraseñas en el código; usa variables de entorno.
- No borres ni reescribas archivos completos si basta con cambiar una parte.
- No toques los archivos de data/ sin avisarme.

## Valores de referencia para verificar cálculos
Con data/ventas_ejemplo.csv el resultado correcto es:
- Ventas totales: 41.122.000
- Número de ventas: 400
- Ticket promedio: 102.805