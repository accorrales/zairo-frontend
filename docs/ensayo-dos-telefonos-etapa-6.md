# Ensayo guiado de etapa 6 con dos teléfonos

**Estado: preparado; pendiente de entorno HTTPS accesible y resultados físicos.** No se ha publicado un entorno. No usar localhost, IP interna del cloud ni producción en los teléfonos. La configuración técnica está en backend `ops/phone-qa/README.md` y necesita autorización antes de activarse.

Información inicial del usuario: iOS/Safari y Android/Chrome, modelos y versiones no informados. Se propone llamar A al equipo iOS/Safari y B al Android/Chrome; confirmar esa asignación al abrir el ensayo. No hace falta conocer el modelo exacto para empezar.

El coordinador dará **un bloque por vez** y esperará la respuesta. Tener dos teléfonos, Internet/VPN privada activa y otra pantalla autorizada o las hojas impresas de QR ficticios. Las cuentas se entregan por canal privado: Puerta A/B para ingresos y beneficios; Admin A/B únicamente para asignaciones/correcciones. No compartir contraseñas, tokens ni QR en el informe. No hay clientes reales ni mensajes reales.

## Bloque 0 · Acceso (todavía no habilitado)

- A y B: conectar la VPN autorizada y abrir `{URL_PRIVADA}/login`, que se entregará solo después de verificar su existencia y certificado. Entrar con Puerta A y Puerta B, respectivamente.
- Abrir Control de acceso. En ambos elegir **ENSAYO ZAIRO · Puerta**. En otra pantalla abrir `{URL_PRIVADA}/ensayo/qr` o usar los QR impresos.
- Esperado: página Zairo con conexión HTTPS válida y mismo evento en ambos. No debe pedir ignorar advertencias de certificado. No abrir la cámara si el sitio no es seguro.
- Comunicar: «A: abre/no abre, Safari, iOS. B: abre/no abre, Chrome, Android. Evento visible: …». Si falla, copiar solo el texto del error; nunca contraseña. No continuar hasta resolverlo.

## Bloque 1 · Permiso y lectura real

- A: tocar Iniciar cámara, autorizar y apuntar a **CAMARA-1** en otra pantalla o papel.
- B: lo mismo con **CAMARA-2**.
- Esperado: ACCESO APROBADO, persona CAMARA-1/2, GENERAL, sin mesa ni beneficios. El resultado queda visible para leerlo. Ver el resultado no habilita otro ingreso por sí solo.
- Comunicar por equipo: permiso apareció/sí/no, cámara abre/sí/no, QR leído/sí/no y texto de resultado. Si falla, indicar si estaba impreso o en pantalla. Esperar devolución del coordinador.

## Bloque 2 · Luz, linterna, siguiente y regreso

- Tocar Siguiente QR. Con poca luz A lee **CAMARA-3** y B **CAMARA-4**. Si Linterna está disponible, encenderla y observar; si está deshabilitada, registrar «no disponible», no asumir un fallo.
- Volver a luz normal. Salir a otra aplicación unos segundos y volver. Tocar Siguiente QR; A lee **CAMARA-5**, B **CAMARA-6**.
- Esperado: resultado legible, sin reemplazo automático. Siguiente limpia el anterior y permite leer otro QR sin reiniciar innecesariamente la cámara. Si el sistema detuvo la cámara al salir, registrar lo ocurrido antes de usar Detener/Iniciar.
- Comunicar: lectura con poca luz, disponibilidad/efecto de linterna, si hubo reinicio, comportamiento al volver y cualquier mensaje. Son observaciones físicas, no equivalentes a los tiempos de cámara virtual anteriores.

## Bloque 3 · General válida

- A: Siguiente QR y leer **GENERAL-1**. B observa su pantalla sin escanear este QR.
- Esperado: aprobación GENERAL, sin mesa ni beneficios compartidos. No deben aparecer formularios vacíos.
- Comunicar: persona, zona y resultado; confirmar que el nombre anterior ya no aparece.

## Bloque 4A · Primeras tres personas VIP y consulta

- A lee **VIP-P1-1**, luego Siguiente y **VIP-P1-2**. B lee **VIP-P1-3**.
- Abrir Ver grupo y beneficios. Consultar/Actualizar grupo en ambos, sin registrar entregas ni reservas.
- Esperado: promoción de seis VIP, **3 de 6**, mesa pendiente de asignación; beneficios de 1 y 4 unidades con entregados 0. El ID de paquete debe coincidir en ambas pantallas.
- Comunicar: contador antes/después de consultar, ID del paquete y saldos. Consultar debe conservar 3 de 6.

## Bloque 4B · Otras tres, repetido y otro evento

- A y B se reparten **VIP-P1-4, VIP-P1-5 y VIP-P1-6**, cada QR una sola vez y Siguiente entre lecturas.
- A vuelve a leer **VIP-P1-1**. B lee **OTRO-EVENTO-1** manteniendo seleccionado ENSAYO ZAIRO · Puerta.
- Esperado: P1 llega a **6 de 6**; usado y otro evento rechazados con motivo. No se registra otra entrada por esas consultas/rechazos.
- Comunicar: contador final, motivo del usado y motivo del otro evento. No cambiar a otro evento para intentar forzar la aprobación.

## Bloque 5 · Mismo QR en ambos teléfonos

- Ambos listos en Siguiente QR. Mostrar **SIMULTANEO-1**. A y B apuntan casi al mismo tiempo con una cuenta Puerta distinta en cada uno.
- Esperado: exactamente una aprobación y un rechazo de entrada utilizada; una sola admisión en servidor. Si hay resultado incierto, nadie da por aprobado el acceso hasta recuperarlo.
- Comunicar resultado de A y B, persona y hora aproximada. El coordinador contrastará el registro; la coincidencia temporal manual no prueba por sí sola la superposición exacta de las solicitudes.

## Bloque 6A · Entrega parcial y saldo restante

- Abrir el grupo P1 desde Recepción (consultar no escanea otra entrada). A elige **Bebidas ficticias**, cantidad **2**, Revisar y Confirmar. Leer la confirmación.
- B actualiza el grupo y registra las **2** restantes, solo después de ver saldo 2.
- Esperado: primero incluidos 4/entregados 2/pendientes 2; después entrega completa 4 de 4, sin campo con cantidad anterior. Actualizar en ambos muestra lo mismo.
- Comunicar saldos de ambas pantallas tras cada entrega. Si la respuesta es incierta, no repetir como operación nueva.

## Bloque 6B · Última unidad concurrente

- A y B actualizan P1. Elegir **Beneficio de una unidad (ficticio)**, cantidad 1, y revisar. Confirmar ambos casi simultáneamente.
- Esperado: una sola entrega confirmada; el otro intento es rechazado o ya no permite entregar. Actualizar debe mostrar en ambos entregados 1/pendientes 0, sin exceso.
- Comunicar resultado de cada intento y saldos después de Actualizar. El coordinador comprobará un único movimiento positivo de esa unidad.

## Bloque 7 · Corrección con motivo

- Resolver cualquier pendiente antes de cambiar de cuenta. A cierra sesión y entra como Admin A; B conserva Puerta B. En A abrir Recepción y P1.
- En Bebidas ficticias abrir Corregir registro, cantidad 1 y motivo «Ensayo: corrección del registro». Revisar y confirmar. Desplegar Historial. B actualiza P1.
- Esperado: entregados **4 → 3**, pendientes **0 → 1**, efecto explícito sobre el registro, responsable, fecha/hora y motivo; no afirmación de devolución física. B consulta el nuevo saldo pero no dispone de corrección administrativa.
- Comunicar saldo de ambos, texto histórico y si B tiene un control de corrección. La autorización backend ya tiene pruebas automatizadas; ocultar un botón no la demuestra por sí solo.

## Bloque 8A · Asignar y cambiar mesa

- A como Admin A: en Recepción abrir P1, cambiar reserva a **VIP A**, motivo «Ensayo: asignación inicial». Confirmar. Cambiar a **VIP B**, motivo «Ensayo: cambio de mesa» y confirmar.
- Abrir Historial y desplazarse. Cerrar el detalle y comprobar que búsqueda/posición se conservan. Consultar P2.
- Esperado: encabezado de P1 mantiene su ID y mesa al desplazarse, cambios auditados. Reserva no significa ocupación física. P2, aunque pertenece a la misma compra, sigue sin reserva, 0 de 6 y sin entregas.
- Comunicar referencias de P1/P2, historial, regreso y que no se mezclaron sus datos.

## Bloque 8B · Dos paquetes intentan la misma mesa

- B resuelve pendientes, cierra sesión y entra como **Admin B**. A mantiene Admin A. No dar permisos de administración a Puerta A/B.
- A abre P1 y B abre P2. Ambos eligen **VIP C** y un motivo de ensayo. Revisar y confirmar casi al mismo tiempo.
- Esperado: solo un paquete reserva VIP C; el otro ve rechazo por reserva existente. Actualizar ambos. Si pierde P1, conserva VIP B; si pierde P2, continúa pendiente. Nunca ambas reservas en VIP C. Conteos y beneficios de cada paquete permanecen independientes.
- Comunicar ganador, rechazo y mesa actual de cada paquete. El coordinador contrastará la reserva única y su historial.

## Bloque 9A · Ingreso sin conexión y recuperación

- Resolver pendientes. A vuelve a Puerta A. Con aplicación cargada y lista, activar modo avión (sin Wi-Fi ni datos). Leer **SIN-RED-1**.
- Esperado: **Resultado sin confirmar**, nunca acceso aprobado ni QR inválido por el solo corte. Siguiente debe quedar bloqueado.
- Restaurar Internet y la VPN. Recuperar resultado. Si aún no existe recibo porque la solicitud no llegó, usar **Reintentar la misma operación**, sin iniciar otra validación ni borrar almacenamiento.
- Esperado al resolver: una única admisión confirmada. Comunicar mensaje sin conexión, recuperación/reintento realizado y resultado. El coordinador comparará la identidad original y el conteo.

## Bloque 9B · Cerrar un panel con entrega incierta

- Con Internet, abrir P2 y comprobar sus Bebidas ficticias sin entregas. Cortar conexión; intentar registrar 1 unidad explícita y esperar el aviso incierto.
- Cerrar el detalle y volver a Recepción. No intentar otra entrega ni cambiar de cuenta. Restaurar conexión/VPN y abrir Pendientes; recuperar o reintentar **la misma operación** cuando corresponda.
- Esperado: la operación sigue pendiente al volver; no se habilita una entrega nueva que la duplique. Al resolver, P2 tiene entregados 1/pendientes 3. P1 conserva su saldo, reserva y miembros.
- Comunicar aviso, presencia de Pendientes tras cerrar, acción usada al recuperar y saldos finales. No borrar caché ni cerrar sesión con una operación incierta.

## Caso de respuesta perdida exactamente después de registrar

El corte manual anterior no identifica el punto exacto del fallo. El caso exacto ya se ensaya mediante Playwright: recibe la respuesta real del servidor y la descarta antes de entregarla a la interfaz, luego recupera el recibo original. Se registra como **automatización/simulación**, nunca como prueba física de estos teléfonos. No se habilitan endpoints de fallo en producción ni se declara que apagar Wi-Fi demuestre ese caso.

## Registro y cierre

Por cada bloque el coordinador registra en `ensayo-dos-telefonos-etapa-6-resultados.csv`: equipo, sistema/navegador/modelo disponible, esperado, observado, clasificación (físico / automatización-simulación / pendiente) y evidencia. Una captura debe evitar credenciales y datos reales. Sin respuesta del usuario, el caso permanece pendiente.

Si falla: detener ese bloque, registrar el texto/acción, investigar, corregir con commit nuevo si corresponde y repetir el caso afectado y las comprobaciones relacionadas. No modificar permisos ni reglas para aprobarlo.

Solo tras recoger resultados y contrastar registros se decidirá si puede usarse en un evento. Conservar informe sin secretos y luego retirar VPN/servicios y borrar datos, credenciales y QR ficticios mediante la limpieza acotada. La falta de URL autorizada o de resultados físicos impide declarar validación operativa completa.
