# Lab Química API — Etapa 3: Backend funcional

API REST para administrar materiales e inventario, préstamos y devoluciones de un laboratorio de química.

## Tecnologías
Node.js, Express, MySQL y Postman.

## Requisitos
- Node.js 18 o superior.
- MySQL instalado y en ejecución.
- MySQL Workbench para ejecutar el script SQL.
- Postman para ejecutar la colección de pruebas.

## Instalación
1. Abre MySQL Workbench y ejecuta `database/schema.sql`.
2. Copia `.env.example` como `.env`.
3. Edita `.env` y configura `DB_USER` y `DB_PASSWORD` con tus datos de MySQL.
4. Abre una terminal en la carpeta del proyecto y ejecuta:
   `npm install`
5. Después ejecuta:
   `npm start`
6. Abre `http://localhost:3000/api/health`. Debe responder que la API y la base de datos están conectadas.

## Endpoints
| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Verificar API/DB |
| GET | `/api/materiales` | Listar materiales |
| GET | `/api/materiales/:id` | Consultar material |
| POST | `/api/materiales` | Crear material |
| PUT | `/api/materiales/:id` | Actualizar material |
| DELETE | `/api/materiales/:id` | Desactivar material y preservar historial |
| GET | `/api/materiales?categoria=VIDRIERIA` | Filtrar por categoría |
| GET | `/api/materiales?q=vaso` | Buscar por nombre/descripción |
| GET | `/api/prestamos` | Listar préstamos |
| GET | `/api/prestamos/:id` | Consultar préstamo |
| POST | `/api/prestamos` | Crear préstamo |
| PATCH | `/api/prestamos/:id/devolver` | Registrar devolución |

## Ejemplos JSON

Crear material — `POST /api/materiales`:
```json
{
  "nombre": "Bureta 50 ml",
  "categoria": "VIDRIERIA",
  "descripcion": "Bureta graduada para titulaciones.",
  "cantidad_total": 6,
  "estado": "ACTIVO"
}
```

Registrar préstamo — `POST /api/prestamos`:
```json
{
  "material_id": 1,
  "responsable": "Juan Pérez",
  "cantidad": 2,
  "fecha_prevista_devolucion": "2026-10-20",
  "observaciones": "Práctica de química analítica."
}
```

Registrar devolución — `PATCH /api/prestamos/1/devolver`, sin cuerpo.

## Regla de negocio
- No se presta más cantidad que la disponible.
- Al prestar, disminuye `cantidad_disponible`.
- Al devolver, aumenta `cantidad_disponible` y el préstamo pasa a `DEVUELTO`.
- Se rechaza una segunda devolución.
- El material se desactiva lógicamente para conservar su historial.
- La API usa transacciones y bloqueos de fila en préstamo/devolución para proteger la disponibilidad.

## Códigos HTTP
200 operación correcta; 201 creación; 400 datos inválidos; 404 registro/ruta inexistente; 409 conflicto de negocio; 500 error inesperado.

## Pruebas Postman
Importa `postman/Lab_Quimica_API.postman_collection.json`.
Ejecuta Health, listar materiales, filtro por categoría, crear préstamo, prueba de cantidad excesiva y devolución. Verifica que el inventario cambie en MySQL.

## Estructura
- `database/schema.sql`: base de datos y tablas.
- `src/server.js`: inicio de API.
- `src/db.js`: conexión MySQL.
- `src/routes/`: endpoints.
- `src/middleware/`: manejo de errores y rutas inexistentes.
- `postman/`: colección de pruebas.

El código debe ejecutarse con MySQL configurado para poder demostrar las pruebas en vivo.
