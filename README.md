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
3. Edita `.env` y configura `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` y `LABORATORISTA_REGISTRATION_CODE`.
4. Abre una terminal en la carpeta del proyecto y ejecuta:
   `npm install`
5. El API usa el puerto definido en `.env` (en la configuración local actual, `3001`). Después ejecuta:
   `npm start`
6. Abre `http://localhost:3000/api/health`. Debe responder que la API y la base de datos están conectadas.

## Endpoints
| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Verificar API/DB |
| POST | `/api/auth/register` | Registrar estudiante; para laboratorista requiere código institucional |
| POST | `/api/auth/login` | Iniciar sesión y obtener token |
| GET | `/api/auth/me` | Consultar perfil con token Bearer |
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
- Las contraseñas se almacenan con hash bcrypt. Los registros aceptan roles Estudiante y Laboratorista; el segundo requiere `LABORATORISTA_REGISTRATION_CODE` configurado en el servidor.
- Todo acceso a préstamos requiere sesión. Estudiantes consultan únicamente los préstamos ligados a su usuario; laboratoristas pueden consultar el historial general y registrar devoluciones.
- Todo acceso al catálogo requiere sesión; únicamente laboratoristas pueden crear, editar o desactivar materiales.
- Cada préstamo nuevo guarda el `usuario_id` derivado del token. Los registros anteriores a la migración no se asignan a una persona y quedan visibles solo en la vista general de laboratorista.
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

## Registro de usuarios
`POST /api/auth/register` acepta nombre, correo, contraseña y rol (`ESTUDIANTE` o `LABORATORISTA`). La contraseña debe tener al menos 8 caracteres y se almacena con bcrypt. Para registro de laboratoristas, define un valor privado en `LABORATORISTA_REGISTRATION_CODE` y compártelo únicamente con el equipo del laboratorio. La app da inicio a la sesión al completar el registro.

## Ejecución local actual
El API del proyecto se ejecuta en `http://localhost:3001`; la app Android apunta al emulador mediante `http://10.0.2.2:3001/`. MySQL debe estar activo en el equipo. Esta es una ejecución local, no un despliegue público: otras redes no podrán acceder hasta alojar el backend y MySQL en infraestructura con URL pública y configurar HTTPS.

## Historial por usuario
La tabla `prestamos.usuario_id` relaciona cada préstamo con el usuario autenticado. En una base existente, ejecutar una vez `database/migrations/001_link_prestamos_to_users.sql`. Los registros históricos quedan con `usuario_id` vacío, ya que el campo anterior `responsable` no permite atribuirlos de forma confiable; aparecen en el historial general del laboratorista y no en el historial personal de estudiantes.
