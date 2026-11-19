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

## Cierre de usabilidad y operación (posterior a 77b082b)

Se revisó este informe y el código anterior antes de modificarlo. La validación individual, los paquetes concretos, snapshots, reservas exclusivas, saldos transaccionales, permisos y recibos idempotentes ya existían; se amplían sin reemplazarlos. El informe anterior describe la primera entrega y sus mediciones históricas.

### Cambios

- Encabezado compacto exclusivo de Control de acceso/Recepción; evento visible y resultado único, con aprobación/rechazo/resultado sin confirmar, motivo, persona, zona escrita, estado de mesa, promoción y contador. Ajustes secundarios plegados. Siguiente QR limpia la información anterior y reanuda el mismo lector después de renderizar, sin pausa fija; el mismo fotograma no produce otra solicitud. No se sustituye un resultado mientras se está revisando.
- «Ver grupo y beneficios» abre un panel con cierre y foco, en lugar de repetir el resumen en dos tarjetas. Consultar no registra ingreso. Los casos General no muestran formularios vacíos de beneficios ni asignación.
- Recepción conserva búsqueda, evento y posición al volver del detalle. En celular, tarjetas relacionan paquete/compra/promoción/zona/mesa/conteo/acción sin desplazamiento horizontal; computadora mantiene tabla. Configuración administrativa de mesas separada. Reserva no equivale a ocupación física.
- Beneficios muestran Incluidos/Entregados/Pendientes. Revisión y confirmación identifican nombre y cantidad; unidades enteras entre 1 y saldo, corrección solo administrativa con motivo. Una confirmación actualiza el grupo una vez, limpia el campo afectado y reemplaza la entrega agotada por «Entrega completa». Cortesía individual sigue siendo otra operación.
- Resultado incierto específico de ingreso, entrega, corrección, reserva o configuración. Solo se afirma ingreso confirmado cuando el resultado del escaneo del contexto lo demuestra. El aviso recibe foco y queda visible; los saldos anteriores se ocultan hasta recuperarlos.
- Solicitudes persistidas antes de enviarse, bloqueadas entre ámbitos mientras hay una por recuperar. Cerrar panel, navegar o recargar no descarta su identidad. Recuperar lee el recibo; reintentar conserva UUID y cuerpo original. Se retira la solicitud solo después de consumir y renderizar su resultado en una vista viva. Un rechazo HTTP sin recibo, por ejemplo sesión vencida, no borra una operación incierta anterior. Requiere el backend actualizado que identifica respuestas transaccionales mediante `X-Zairo-Operation-Id`.
- El almacenamiento persistente contiene el identificador de QR, IDs, cantidad y motivo necesarios para repetir la misma solicitud; no respuestas, nombres de asistentes ni campos personales de QR JSON antiguos. Los datos de consulta permanecen en memoria. El contexto de lista utiliza sessionStorage de la cuenta. Las operaciones sin resolver no caducan ni se reenvían automáticamente; borrar el almacenamiento del navegador rompe esa recuperación local y debe evitarse durante la operación.
- Se ignoran lecturas antiguas tras cambiar evento, paquete o cerrar detalle. Después de una operación confirmada se consulta el grupo afectado y se actualiza su fila/reserva en memoria; no se recarga toda recepción. El escáner reutiliza el grupo de su respuesta y solo consulta mesas para asignación administrativa.
- Historial desplegable con cambio de mesa, beneficio, cantidad, responsable legible, fecha/hora y motivo. La nueva migración del backend conserva el nombre del responsable de nuevas acciones; para registros anteriores solo puede mostrar el nombre actual o «Personal autorizado». No se inventa trazabilidad retrospectiva.

### Pruebas del cierre

- 79 pruebas frontend aprobadas, incluidas cantidades inválidas, confirmación explícita, corrección con motivo, limpieza del campo y actualización única, respuesta tardía de otro paquete, mensajes específicos, persistencia/acknowledgement, clave original y bloqueo de reintentos simultáneos. Las regresiones de compras, catálogo, roles, contabilidad y dinero siguen aprobadas.
- 32 pruebas backend aprobadas. Migración de nombres repetible conserva movimientos originales y correcciones. Build backend: placeholder existente, no compilación. Builds frontend normal y `build:verification` aprobados; advertencias CommonJS preexistentes de PDF/canvg, sin dependencias nuevas ni descarga de fuentes externas.
- PostgreSQL local/HTTP real: seis llegadas individuales, General, dos paquetes de una compra, QR repetido/concurrente, otro evento/invalidado/no pagado; reservas concurrentes y exclusividad, entregas parciales/completas/concurrentes del último saldo, corrección autorizada con motivo, cortesías independientes, cinco roles y distribución antigua ambigua. Edición de oferta no modifica lo adquirido. La migración de nombres se repitió y el nombre histórico permaneció incluso al renombrar temporalmente usuarios ficticios.
- Chromium real con viewport emulado: VIP 3 de 6 y luego 6 de 6; General sin mesa/beneficios; repetido, QR inválido y otro evento. Consulta sin ingreso; doble clic una solicitud; cantidades cero/negativas/fraccionarias/sobre saldo no envían; entrega completa sin campo antiguo. Ingreso, entrega y reserva procesados por el servidor y luego respuesta abortada: cierre/navegación/recarga y recuperación o reintento de la identidad original sin duplicar efecto ni historial. Corrección y auditoría desplegada. Búsqueda/evento/posición conservados; respuestas atrasadas de evento o paquete descartadas. Subtotal, descuento y total de todas las compras de la prueba idénticos antes y después de las acciones operativas.
- Roles Admin/Entrada conservan sus funciones; Contabilidad/RRHH/Visor no acceden a rutas operativas y el backend rechaza sus consultas/mutaciones. Entrada no configura/asigna mesas ni corrige entregas. No se amplían permisos.
- Recorrido completo de interfaz: compra pública ficticia 2×6, total 150000 sin cambios, confirmación administrativa, ingreso y entrega explícita; segundo paquete sin entregas. Correo sustituido antes de cargar la aplicación QA y salida WhatsApp interceptada: ningún envío real.
- 1440×1000, 390×844, 360×740/640 y 360×440: resultado y Siguiente QR visibles; panel desplazable, cierre, foco inicial, ciclo Tab/Shift+Tab y Escape; estados vacío/cargando/error/reintento. La pantalla de poca altura simula espacio reducido, no un teclado físico de teléfono. No se certifica auditoría completa WCAG ni uso con lector de pantalla.

La reproducción de concurrencia y API está en `scripts/verify-operacion-local.cjs` del backend; la de navegador en `scripts/verify-operacion-usabilidad-browser.cjs`. Exigen QA local explícito. Preparar fixtures con el verificador, ejecutar el navegador una vez y limpiar; una segunda corrida necesita fixtures nuevos porque los QR se consumen. Playwright, Chromium y ffmpeg son herramientas del entorno QA, no dependencias nuevas del producto. Las capturas contienen exclusivamente datos ficticios y no se incorporan a Git.

### Medición y límites

Ver `mediciones-cierre-etapa-6.json` para muestras separadas de carga inicial, HTTP de validación, respuesta a resultado utilizable, Siguiente QR y cámara virtual. Es una muestra por escenario, no percentiles de carga ni promesa de operación en campo. La medición de respuesta comienza al recibir sus encabezados e incluye cuerpo, render y habilitación de la acción. Red lenta: caché fría, 400 kbps en ambas direcciones, latencia CDP 150 ms y CPU 4×; PostgreSQL y servidor locales. Cámara: fotogramas QR sintéticos procesados por html5-qrcode, sin cámara física. No se probaron enfoque, luz, movimiento, linterna, audio ni vibración en hardware real. No hay aprobación offline.

### Ensayo previo con dos teléfonos físicos (pendiente)

1. En una instancia de desarrollo HTTPS con notificaciones desactivadas, correo simulado y datos ficticios, iniciar dos cuentas Entrada y una Admin; no usar producción. Seleccionar el mismo evento. Probar permiso de cámara, orientación, enfoque con luz baja, sonido/linterna disponibles y teclado abierto; comprobar que se puede cerrar y confirmar sin recortes.
2. Escanear el mismo QR simultáneamente: un único ingreso confirmado. Llegar 3+3 al paquete de seis, leer resultado sin reemplazo y continuar con otro QR; consultar grupo no cambia conteo. Probar QR General, usado, invalidado, no pagado y de otro evento.
3. Intentar el último beneficio en ambos teléfonos: una sola entrega, saldo nunca negativo. Con dos administradores intentar reservar la misma mesa para paquetes distintos: una única reserva. Confirmar separación entre paquetes de la misma compra.
4. Cortar la conexión después de enviar ingreso, entrega y reserva. No permitir acceso ni repetir como operación nueva mientras el resultado sea desconocido. Cerrar/reabrir o recargar, recuperar y reintentar la misma identidad; contrastar un único efecto e historial en servidor.
5. Corregir entrega con Admin y motivo; verificar movimiento original, corrección, responsable/fecha y nuevo saldo. Intentarlo con Entrada y verificar rechazo. Volver del detalle y revisar búsqueda/contexto, tamaños táctiles y visibilidad del resultado con teclado real.

No se desplegó, mezcló ni avanzó a etapa 7. Las pruebas se realizaron con servidor QA que confirma `emailStub=true`, `notifications=false`; WhatsApp desactivado/interceptado. La limpieza final se registra en el cierre de ejecución.

Muestra final del cierre (redondeada): carga fría hasta eventos disponibles **4852 ms**; validación HTTP **25 ms local / 235 ms con red lenta**; encabezados de respuesta a resultado utilizable **31 / 90 ms**; Siguiente QR **56 / 74 ms**; preparación de cámara virtual **121 ms**. La navegación caliente registró 767 ms, incluyendo la ventana `networkidle` de 500 ms; no se compara directamente con el criterio de carga fría. La observación automatizada añade latencia; no son tiempos puros del render ni una medición física.

Evidencia final: **24 PNG** (computadora, 390/360 px y estados operativos) y ZIP que contiene los 24 originales. Incluye resultado VIP/General/rechazo, detalle e integrantes, recepción, entrega parcial/completa, respuestas inciertas de las tres operaciones e historial con corrección. Las capturas de paneles son del viewport real del navegador, sin montar imágenes ni extender artificialmente el panel a toda la lista subyacente.

Cierre de ejecución: se eliminó exclusivamente el conjunto etiquetado de fixtures; las siete tablas operativas quedaron con cero filas, incluidas auditorías y recibos. Se entregaron, tras autorización específica, 14 PNG principales y el ZIP con 24 PNG en Google Drive privado. Lectura posterior de metadatos en los 15 archivos: `shared=false` y únicamente permiso `owner`, sin enlaces públicos ni destinatarios adicionales. No se incorporaron archivos de captura, credenciales, datos de base ni secretos al repositorio.

## Tres ajustes menores del cierre

Se preservan d056b48, 5894c82 y los commits anteriores. Alcance limitado a estos ajustes:

1. **Ingreso incierto sin duplicación.** El resultado conserva un único recuadro con título, explicación, evento y recuperación/reintento. El componente compartido admite controles integrados sin repetir aviso ni explicación, incluso si falla una recuperación. No cambia el UUID, el bloqueo de otra validación ni la exigencia de confirmación del servidor.
2. **Corrección explícita e histórica.** El historial identifica beneficio, aumento/disminución del registro y singular/plural. Las operaciones nuevas incluyen saldos entregados/pendientes antes y después, tomados por el backend bajo el lock de la transacción. Se muestran esos valores conservados aunque otra entrega cambie luego el saldo actual. Una corrección negativa indica expresamente que no confirma devolución física. Si faltan saldos históricos suficientes, se muestran cantidad/responsable/fecha/motivo disponibles y la limitación; nunca se calculan desde el saldo actual. Se conservan las correcciones administrativas negativas y el motivo obligatorio, sin nuevas clases de operación o permisos.
3. **Referencia fija del paquete.** El encabezado de Grupo y beneficios muestra ID real y reserva, asignación pendiente o mesa no incluida. Una reserva por confirmar reemplaza la etiqueta de mesa por «Cambio de mesa sin confirmar», aunque una consulta ya alcance a ver el cambio del servidor. Recuperar actualiza la referencia. El nombre largo se distribuye en líneas sin tapar el cuerpo desplazable ni el cierre. Tras actualizar la fila o cambiar el ancho, el regreso enfoca el botón visible del mismo paquete, conservando búsqueda y posición.

### Verificación de estos ajustes

- Frontend: **82 pruebas aprobadas**, incluidos render de historial antiguo/nuevo, saldos históricos independientes del saldo actual, singular/plural, referencia al cambiar paquete/reserva y controles de recuperación sin aviso duplicado tras un error.
- Backend: **32 pruebas aprobadas**, ampliando compatibilidad/repetición de migración sin completar saldos antiguos con datos inferidos. Builds frontend normal y verification aprobados; advertencias CommonJS conocidas, sin dependencias nuevas. Build backend sigue siendo placeholder.
- PostgreSQL/HTTP local: se repitió el verificador de acceso, paquetes, concurrencia, permisos y snapshots. Corrección real ficticia 4 → 3 entregados y 0 → 1 pendientes, seguida de otra entrega que vuelve el saldo actual a 4: el movimiento original conserva 4 → 3. La nueva migración se ejecutó dos veces con movimientos existentes y no alteró ninguna fila previa.
- Chromium con API/PostgreSQL reales: se abortó la respuesta de ingreso después del commit; un solo aviso/recuadro, evento presente, nueva validación bloqueada y recuperación tras recargar con la clave original, una única admisión. Historial con beneficio, cantidad, efecto, saldos correctos, responsable, fecha/hora y motivo; singular/plural visibles. Reserva cuya respuesta se pierde después del commit: encabezado sin mesa falsamente confirmada, cambio a otro paquete correcto y recuperación de la reserva sin nuevo movimiento. Nombre largo, encabezado fijo al desplazarse a historial, cierre con teclado, foco y búsqueda conservados.
- Anchos **360 y 390 px**, **1440×1000** y pantalla baja **360×440**. Once capturas originales de navegador y ZIP. No son montajes; solo datos ficticios. Los registros antiguos con saldos ausentes se verificaron con migración PGlite y render unitario, sin reconstruir ni inventar historial real.

Se usó entrada manual de QR y emulación de viewport; **no se probaron teléfonos, cámara ni teclado móvil físicos en este ajuste**. Las limitaciones del ensayo físico previo permanecen. Sin cambios a cálculos/exportaciones, compras o permisos; sin despliegue, mezcla, mensajes reales ni etapa 7. Servidor QA con emailStub=true y notifications=false; WhatsApp desactivado y tráfico externo de navegador bloqueado.

Limpieza del ajuste: fixtures ficticios eliminados de forma acotada y siete tablas operativas vacías. Se mantienen fuera de Git las once capturas y el ZIP, sin credenciales ni datos de base incluidos en los commits.

## Ensayo guiado con dos teléfonos: preparación, sin validación física

Se conserva 0338708 y toda su historia. Se revisaron ambos informes; no se encontró una URL de pruebas HTTPS verificable desde teléfonos. Los servicios locales y la configuración de producción no sustituyen ese entorno. No se conectó producción ni se publicó un servicio.

Se agregan `docs/ensayo-dos-telefonos-etapa-6.md` (bloques cortos con acción/esperado/respuesta a comunicar) y `docs/ensayo-dos-telefonos-etapa-6-resultados.csv` (equipo, sistema/navegador/modelo, esperado, observado, clasificación y evidencia). El usuario indicó iOS/Safari y Android/Chrome sin modelos; A/B es una asignación propuesta. **Todos los casos físicos están pendientes; ninguno se aprobó por inferencia.**

Preparación técnica en backend ops/phone-qa: base nueva, cuentas/QR ficticios no consumidos por el seed, snapshot 1+4, dos paquetes independientes de una compra, General/otro evento y QR dedicados para cámara/concurrencia/sin red. Roles Entrada preservados; dos Admin separados para ensayar reservas concurrentes. No hay credenciales en Git ni en la hoja QR. El gateway monta solo el subdirectorio de QR y bloquea WhatsApp.

Frontend: compilación adicional **build:phone-qa**, con API relativa del mismo origen, sin descarga de fuentes ni handlers inline para cargar CSS crítico. Mantiene intactos production y verification. El gateway de ensayo tiene CSP para recursos propios, cámara del mismo origen, sin recursos externos y sin caché de datos; permite base href del mismo origen para recargas de rutas profundas. No cambia componentes de negocio, identidad visual, permisos ni cálculos.

Verificación automatizada: **82 pruebas Angular**, una prueba Node del gateway, **33 backend** y build:phone-qa. Se construyeron y ejecutaron las imágenes Docker y el stack local: API/DB sin puertos publicados, gateway únicamente loopback, cuatro inicios de sesión, lectura de grupos/mesas y 22 QR imprimibles comprobados sin consumir entradas en esa comprobación. La construcción del cloud usó CA de proxy montada temporalmente como secreto BuildKit, sin desactivar TLS ni incorporarla al runtime.

Se repitió la simulación controlada de respuestas abortadas **después** de que el servidor registrara ingreso, entrega y reserva: recuperaciones con clave original y un solo efecto. Es Chromium automatizado, no cámara ni teléfono físico; no se interpreta un corte manual de Wi-Fi como prueba de ese punto exacto. Evidencia sin secretos en backend docs/ensayo-telefonos-preparacion.json.

Falta autorizar máquina/cuenta/participantes y costo de un entorno separado con VPN privada y HTTPS; después comprobar acceso real desde ambos equipos y recibir resultados de cada bloque. No se contrató ni activó hosting/VPN ni se expusieron servicios públicamente. Los QR definitivos se generarán en la instancia autorizada; los del preflight local no se entregan como entradas activas remotas. Hasta entonces y hasta los resultados físicos, **no se declara validación operativa completa**. Sin mezcla, mensajes reales, notificaciones automáticas o etapa 7.

Cierre de preflight: datos/credenciales/QR eliminados y stack local retirado después de verificar la limpieza. No hay QR ni URL remotos activos para comenzar el ensayo. La VPN integrada del cloud solo ofrece acceso saliente; se necesita una máquina externa autorizada para el acceso entrante privado de los teléfonos. Los 28 registros físicos de la matriz permanecen pendientes, más dos registros de preparación/simulación separados.


## Corrección operativa: empleados con historial

La pantalla muestra explicación específica ante409 por planillas u otros registros asociados, sin ocultar filas ni afirmar que hubo borrado. Distingue sesión/permisos,404 y respuesta de red incierta; bloquea doble envío mientras DELETE está pendiente. El formulario de edición expone Activo/Inactivo usando el estado ya soportado por backend; guardar conserva la selección en lugar de forzar siempre activo. Abrir Nuevo empleado limpia el destino de una edición cancelada, evitando actualizar por error al empleado anterior. No se cambian cálculos ni permisos; inactivar requiere acción explícita del operador, nunca ocurre al intentar borrar.

Verificación:88/88 pruebas Angular y build de producción aprobado. Regresiones: conflicto conserva lista y explica historial, doble clic genera una petición, cancelar no elimina, distinción de errores, selector accesible de estado y persistencia de inactivo en payload, alta nueva sin reutilizar destino anterior. No se han realizado borrados de empleados reales para probar.


## Mensajes según la causa en administración y contabilidad

Conceptos/Novedades ahora muestran errores de crear/editar/eliminar, antes visibles solo en consola. Empleados, Planillas, Reportes, Resumen y Detalle de Planilla usan el formateador compartido adminErrorMessage: mensaje API seguro según código, sesión vencida, permisos,404, conflicto, validación, indisponibilidad o respuesta incierta. No se imprimen errores SQL heredados en pantalla. Una respuesta perdida al modificar no se describe como un rechazo definitivo ni se reenvía automáticamente. Los formularios y datos previamente cargados se conservan al fallar.

PageLoadState distingue aviso informativo y error, con rol alert y estilo compartido; permite cerrar el mensaje. Errores de consulta no se sustituyen por reportes o indicadores cero; se conserva reintento para conectividad, y se evita ofrecerlo como solución a permisos/registro inexistente. Se contextualizan las fuentes necesarias para Reportes y Resumen. El PDF mantiene su contenido/importes; si falla la generación local, muestra un mensaje en lugar de quedar silencioso.

Validación:98/98 pruebas Angular, build producción aprobado. Nuevos casos incluyen motivos de vínculo/duplicado/validación/estado, sanitización de errores técnicos, incertidumbre de escrituras, alertas y reintento, Conceptos con formulario/lista conservados, Novedad con referencia inexistente, confirmación pendiente con totales intactos, Reportes403 sin tarjetas financieras y Resumen sin conexión manteniendo valores anteriores. No se cambian cálculos, exportaciones, permisos, orden visual ni límites del historial. No se realizaron borrados/ediciones de datos reales para verificar.
