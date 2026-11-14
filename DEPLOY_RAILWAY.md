# Despliegue público en Railway

Esta configuración sirve la API por HTTPS y conserva MySQL en un volumen persistente. La base de datos debe quedar privada y solo la API debe tener dominio público.

## Recursos

1. Crear un proyecto Railway y agregar el template oficial MySQL.
2. Añadir el repositorio `juanseruiz958/LabQuimica_API_Entrega_Final` como servicio Node.js (o ejecutar `railway up` desde esta carpeta después de autenticar el CLI). El archivo `railway.toml` configura `npm start` y `/api/health` como health check.
3. En el servicio MySQL, confirmar que tiene volumen persistente. No habilitar proxy TCP público; la API se conecta por red privada.
4. En el servicio Node, crear variables de referencia a las del servicio MySQL:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
   - `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres
   - `LABORATORISTA_REGISTRATION_CODE`: código privado para altas de laboratoristas
5. Ejecutar una vez `npm run db:init` en la consola del servicio Node. El script crea las tablas y los materiales de demostración sin crear cuentas con contraseñas conocidas.
6. Generar el dominio HTTPS del servicio Node y consultar `https://<dominio>/api/health`. Debe responder `estado: OK` y `base_datos: conectada`.
7. Configurar la app con la URL final, generar un APK release firmado y comprobar login, altas, historial personal, inventario y devoluciones.

No añadir `.env` al repositorio ni habilitar acceso público al puerto MySQL. Antes de actualizar la app distribuida, publicar el nuevo APK con la URL HTTPS.

## Costos y cuenta

Railway requiere una cuenta y puede requerir un plan de pago para uso continuo. Los precios publicados actualmente indican Hobby desde US$5/mes, aplicados a los recursos consumidos; el uso de CPU, memoria, almacenamiento y tráfico puede aumentar el valor. El crédito de prueba es temporal y el plan gratuito posterior tiene límites que no son apropiados para prometer disponibilidad permanente. Consulta y fija límites de gasto en la cuenta antes de activar producción.
