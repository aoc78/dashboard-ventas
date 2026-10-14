# Decisión de arquitectura
Elegido: React (frontend) + FastAPI (backend), sin base de datos.
Por qué: el alcance es analizar un archivo por sesión, sin usuarios ni
persistencia. La API deja la lógica de cálculo probada por separado y
reutilizable. Es el stack que quiero poder ofrecer a clientes.
Descartado: procesamiento 100% en el navegador (más rápido de hacer,
pero no deja una API reutilizable y no practica backend).
Riesgos: CORS, dos despliegues, planes gratuitos que "duermen".