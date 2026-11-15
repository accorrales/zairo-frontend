# Etapa 6 · Acceso, mesas y beneficios

Se conservan los commits anteriores, incluida la corrección monetaria f591715. Se reutilizan la zona y precio por paquete, las compras, QR, cortesías individuales y componentes de identidad Zairo existentes; sin dependencias nuevas ni contenido operativo fijo de un evento.

## Pantallas y operación

- `/admin/kiosk`: evento obligatorio, cámara iniciada explícitamente (carga diferida de html5-qrcode), ingreso manual de QR y resultado aprobado/rechazado/pendiente/no verificable. Nombre, evento, zona escrita VIP/GENERAL, promoción, paquete concreto, mesa y conteo en el resumen; detalle y beneficios debajo. El resultado persiste hasta Siguiente QR, sin espera fija. El mismo cuadro de cámara se ignora después de continuar hasta leer otro QR. Consultar grupo no registra ingreso.
- `/recepcion`: mesas con identificador, zona, tipo y capacidad, reservas por paquete y conteos, búsqueda, consulta y gestión autorizada. No es un plano ni un sensor de ocupación: reserva se etiqueta explícitamente como ocupación física no verificada.
- Panel existente de entradas por evento: campos de tipo de mesa y lista editable de beneficios con cantidades. Al comprar se congelan por cada paquete; editar la oferta no modifica compras previas.
- Checkout: conserva el recorrido y los precios; admite hasta 60 personas para que una compra pueda contener dos paquetes de seis. Identifica paquete e integrante en cada formulario. La información estructurada de beneficios prevalece sobre descripciones antiguas, con fallback para ofertas anteriores.

Se conservan reinicio de cámara, linterna con detección de capacidades, señales locales de sonido/vibración e historial de las últimas seis validaciones de sesión. El historial no constituye un nuevo ingreso y no reemplaza el registro del servidor. El sonido usa Web Audio local, sin recursos externos.

El componente de grupo es compartido por escáner y recepción. Las entregas requieren acción y confirmación explícita, con cantidades pendientes/entregadas; no se entregan automáticamente al escanear. Las correcciones son administrativas, negativas y con motivo; conservan historial. Las cortesías individuales utilizan sus flags existentes y una acción separada de entrega de tiquete, sin alterar beneficios del grupo.

## Respuesta incierta

Cada acción guarda antes de enviarse un UUID y su cuerpo, separados por usuario y ámbito. Una respuesta de transporte incierta o 5xx mantiene la solicitud; Recuperar resultado lee el recibo del servidor y Reintentar reutiliza la misma clave. Recargar conserva el caso pendiente. Un rechazo explícito 4xx es distinto de un fallo de conexión. No hay aprobación offline, confirmación optimista ni reenvío automático. Las acciones se bloquean mientras están en curso o tienen un resultado por recuperar.

## Verificación

- Backend: 32 pruebas; frontend: 66 pruebas. Builds normal y optimizado local de verificación aprobados. El build backend sigue siendo un placeholder, no una compilación.
- PostgreSQL local y HTTP real: seis VIP llegan separadamente (1/6 hasta 6/6); dos paquetes de seis en una compra tienen IDs, integrantes y saldos independientes; General sin mesa/beneficios. Duplicados y dos sesiones concurrentes producen una sola admisión. Otro evento, invalidación y compra pendiente se rechazan sin consumir entrada.
- Asignaciones concurrentes: una única reserva gana; mesa incompatible y paquete sin derecho son rechazados. Cambios y desasignación conservan responsable, fecha y motivo. Entregas parciales, completas, repetición de la clave y solicitudes concurrentes no exceden la cantidad incluida; corrección solo admin y con historial. Modificar la promoción no cambia el snapshot comprado.
- Chromium: cinco roles, rutas denegadas a Contabilidad/RRHH/Visor, consulta de grupo sin ingreso, doble clic sin segunda solicitud, entrega e ingreso cuyo servidor ya confirmó antes de abortar su respuesta; recuperación tras recargar sin duplicar. Roles Admin/Entrada usan las funciones autorizadas; Entrada no recibe edición/asignación de mesas ni corrección.
- Recorrido enteramente desde interfaz: compra pública ficticia de 2×6 VIP (150000), confirmación del pago desde Compras pendientes, ingreso y entrega explícita. La salida a WhatsApp se interceptó y el servicio de correo se sustituyó antes de iniciar el servidor QA: cero envíos reales. El segundo paquete permaneció sin entregas.
- 1440×1000 y 390×844: identidad, textos, foco de resultado y tablas desplazables. 13 PNG reales del navegador; datos exclusivamente ficticios. Seis PNG y ZIP privados autorizados; lectura de Drive confirma shared=false y solo owner en los siete archivos.

## Rendimiento medido

Una muestra de laboratorio por escenario; no son medianas ni garantía de velocidad en campo. Ver `mediciones-etapa-6.json`.

| Medición | Resultado |
|---|---:|
| Pantalla lista, navegación local con recursos en caché | 825 ms |
| Inicio de cámara virtual, incluida carga del lector | 144 ms |
| Validación hasta resultado visible, PostgreSQL local | 190 ms |
| Carga inicial fría, 400 kbps, 150 ms RTT simulado, CPU 4× | 4688 ms |
| Validación en esa conexión/CPU simuladas | 396 ms |

El lector decodificó fotogramas sintéticos de un QR mediante html5-qrcode y se comprobó que no repite el POST al continuar con el mismo cuadro. No se probó cámara, linterna, vibración, altavoz ni teléfono físico. El arranque de una cámara real y la calidad de lectura con luz, enfoque o movimiento quedan pendientes de ensayo físico. No se certifica accesibilidad completa ni rendimiento móvil real.

## Compatibilidad y límites

Los grupos antiguos ambiguos se muestran para revisión, conservando la admisión válida individual; no se inventan miembros, mesas o entregas. Los beneficios solamente descriptivos y sin cantidades verificables se señalan para revisión operativa. No hay herramienta automática que reparta esas compras ni trazas retrospectivas inventadas. Se conserva la zona registrada y los flags históricos de cortesía individual.

El backend y este escáner deben actualizarse juntos: la validación exige evento y clave de operación, también en la ruta anterior. Las migraciones son aditivas y obligatorias; ver el informe del backend. No se cambia contabilidad ni el formato/exportaciones monetarias. Sin despliegue, mezcla, datos reales o notificaciones automáticas.

Cierre verificado: los fixtures de los eventos y usuarios ficticios, compras, paquetes, mesas, movimientos y recibos operativos fueron eliminados mediante la limpieza acotada. No se incorporaron credenciales, entradas, capturas ni datos de la base a Git.
