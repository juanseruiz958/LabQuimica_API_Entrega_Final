# Despliegue gratuito para demostración: Render + TiDB Cloud Starter

Esta opción publica la API en Render Free y guarda los datos en TiDB Cloud Starter, que usa protocolo compatible con MySQL. Es adecuada para una demostración o piloto pequeño dentro de las cuotas gratuitas; no garantiza disponibilidad permanente.

## Límites del plan gratuito

- Render duerme la API tras 15 minutos sin peticiones y el siguiente arranque puede tardar aproximadamente un minuto. También puede reiniciarla y aplica límites mensuales de horas y tráfico.
- TiDB Cloud Starter ofrece por instancia MySQL-compatible hasta 5 GiB de almacenamiento y 50 millones de Request Units por mes. Si se agota la cuota gratuita, detiene conexiones nuevas hasta el siguiente ciclo o hasta cambiar límites/plan.
- La API accede a TiDB por TLS. La app Android accede a la API por HTTPS.

## Preparar las cuentas

1. Crear una instancia **TiDB Cloud Starter** en modo **MySQL Compatible**. Mantener el límite de gasto en cero para permanecer dentro de la cuota gratuita.
2. Crear la base `lab_quimica` y un usuario de aplicación con permisos sobre esa base.
3. Copiar host, puerto (normalmente 4000), usuario y contraseña de conexión. No pegar esos valores en el repositorio.
4. Conectar el repositorio de la API a Render usando Blueprint desde `render.yaml`.
5. Completar las variables solicitadas al crear el servicio: `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`. Las variables JWT e invitación se generan en Render.
6. Desde MySQL Workbench, conectarse al endpoint público de TiDB con TLS y ejecutar `database/schema.sql`. El esquema crea las tablas y materiales de demostración, sin cuentas ni préstamos ficticios.
7. En Render, abrir el servicio y copiar los CIDR de salida desde **Connect → Outbound**. Añadirlos a la lista de IP permitidas del endpoint público de TiDB. Render usa rangos regionales compartidos que pueden rotar; revisar esta lista si la conexión se interrumpe. Evitar dejar la regla abierta a cualquier IP.
8. Esperar a que `/api/health` esté healthy y copiar el dominio HTTPS asignado por Render.
9. Compilar la app apuntando a ese dominio: `./gradlew assembleRelease -PAPI_BASE_URL=https://<dominio-render>/`.

El proyecto está en un repositorio GitHub. Render debe recibir los cambios actuales de la carpeta del API antes de crear el servicio. No se migran automáticamente los datos de MySQL local: la inicialización crea tablas y materiales de muestra, sin cuentas ni préstamos ficticios. El script `npm run db:init` también puede ejecutarse desde la terminal local con las variables `TIDB_*` configuradas.

## Consideraciones

TiDB es compatible con el protocolo MySQL y sus funciones comunes. El API usa transacciones, `FOR UPDATE`, claves foráneas y `AUTO_INCREMENT`; validar esos flujos en la instancia Starter antes de una demostración importante. La cuenta puede pedir verificación telefónica o datos de pago, aunque la cuota Starter puede mantenerse en cero; no aceptar un plan pago para esta ruta gratuita.
