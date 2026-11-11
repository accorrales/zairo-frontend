# Etapa 4 — portada permanente y páginas públicas

## Recorridos

- `/home` mantiene la identidad Zairo. Con cero eventos muestra una portada propia y un estado vacío real, sin inventar fechas, venta ni un megaevento. Con uno lo presenta como protagonista; con varios respeta el destacado y presenta los demás. Un anuncio Próximamente no enlaza a un detalle privado. La selección del panel es la autoridad, incluso para un evento de fecha anterior.
- `/evento/:id` conserva el enlace conocido y ahora presenta el contenido editorial guardado/publicado, respetando orden y visibilidad. Fecha en Costa Rica, historia, concepto, artistas, imágenes, videos manuales y lugar público. Permite copiar su enlace y lo mantiene accesible fuera de portada si sigue publicado.
- `/evento/:id/comprar` conserva el formulario y servicios de compra, tiers, códigos, zonas y paquetes. Los enlaces a una tarifa/promoción usan `?tier=ID`; el checkout selecciona ese tier real si está disponible y prepara la cantidad completa del paquete. No se inventa un plano por el nombre del evento; si no hay plano configurado, presenta las zonas sin coordenadas ficticias.
- Las promociones se pueden presentar con ventas cerradas, sin acciones de compra. El backend valida las reservas. El checkout también reconoce cierres, limpia una selección inválida y no muestra formulario al cargar un evento cerrado.
- Los enlaces de cortesías, usuarios, administración, QR/wallet del backend y Brand Friends permanecen. Los fragmentos de secciones usan rutas Angular; `#entradas` y el punto `#checkout` guían hacia entradas de la página pública.

## Diseño, contenido y medios

Nav y marca permanentes reutilizan la estética oscura, cristal, tipografía del sistema y controles lima de etapa 2. El evento aplica sus colores en contenido editorial. El acento del hero tiene un contraste separado porque la marca conserva un fondo oscuro incluso cuando el evento usa un tema claro. El foco se adapta al fondo editorial.

Los renderizadores genéricos no contienen fechas, textos, imágenes o artistas INFAMOUS. Su contenido histórico se conserva como datos editables del evento mediante una migración protegida en backend. Se agregaron al panel un plano opcional y hasta tres videos con poster/título; la preview los respeta. Los videos no aparecen como elementos de descarga hasta pedir reproducción. No se agregó un constructor libre ni nueva dependencia.

La imagen principal tiene prioridad, el resto usa carga perezosa, dimensiones y espacio reservado. Un error muestra un fallback accesible. Sin imagen se usa una composición de marca, sin atribuir imágenes de otro evento. El loader y nav comparten un solo recurso de logo para evitar descarga duplicada.

Se eliminó `PreloadAllModules`: visitar la portada no debe precargar todas las pantallas administrativas y PDF. Las rutas siguen con lazy loading. El listado público recibe solo metadata y colores, en lugar de cargar todas las historias y galerías.

## Verificaciones

- Etapa 3 comprobada antes de comenzar; commits previos preservados.
- Frontend: 52/52 pruebas en 19 archivos. Home vacío/único/destacado/anuncio/error, detalle cerrado/abierto/privado, promociones y enlace al tier, secciones, compra anterior, imágenes con error, video manual y contraste del hero.
- Build de producción correcto, sin descarga de fuentes; persisten las advertencias CommonJS anteriores de jsPDF/canvg.
- `npm run build:verification`: mismas optimizaciones de producción con API local y salida separada `dist/verification`. Nunca usa el hostname Railway de producción. Se comprobó el bundle antes de probar. El build habitual conserva su configuración de destino.
- Chromium 1440×1000 y 390×844; comprobación de menús, enlaces directos, copiar URL, orden, secciones ocultas, ausencia de overflow, carga/error/reintento y navegación hacia un paquete real de seis VIP. Se creó una sola compra ficticia pendiente, interceptando `window.open`; no se enviaron mensajes o correos. No hubo errores JavaScript ni conexiones externas.
- Fixtures ficticios de eventos, tiers y compra eliminados. Los PNG muestran solo esos datos. ZIP con nueve capturas: principales en ambos tamaños, portada vacía y única, carga/error y checkout.

## Carga lenta medida

Datos de la compilación optimizada de verificación, servida por HTTP local con gzip y proxy local al backend. Chromium móvil 390×844, caché deshabilitado, 400 kbps de bajada/subida, latencia configurada 150 ms y CPU ralentizada 4×. Tres navegaciones nuevas para portada y detalle; un caso adicional con una imagen existente más pesada. Se registran FCP, LCP, transferencias y solicitudes, no solo el evento `load` del documento. El JSON adjunto a esta documentación conserva las muestras.

| Escenario | Primer contenido (FCP) | Mayor contenido (LCP) | Transferido | Solicitudes |
| --- | --- | --- | --- | --- |
| Portada (mediana de 3) | 0.46 s | 5.96 s | 208 kB | 20 |
| Página de evento (mediana de 3) | 0.46 s | 5.93 s | 210 kB | 22 |
| Evento con imagen de 326 kB (1 caso) | 0.60 s | 12.04 s | 505 kB | 22 |

En todas las muestras: cero descargas de video y cero fuentes. La imagen de prueba principal pesa 31 kB; sustituirla por la imagen histórica de 326 kB elevó el LCP a unos 12 segundos en esta simulación. Estos valores todavía necesitan trabajo si se exige un LCP bajo con 400 kbps; no se presentan como una aprobación de rendimiento móvil.

Las mediciones son de laboratorio, no Core Web Vitals reales de visitantes. El servidor local no reproduce servicios específicos del hosting como analytics de Vercel; no se validó su costo. HTTP loopback no incluye CDN/TLS, latencia de PostgreSQL remoto, pérdidas móviles, todos los tamaños de pantalla ni teléfono físico. Los datos y recursos son ficticios controlados. Una portada con otras imágenes puede rendir distinto: el caso pesado ilustra ese límite. No se hizo una comparación numérica contra el build anterior.

No hay pipeline de redimensionado/transcodificación para URLs administradas; la organización debe usar archivos optimizados. La carga pesada y más trabajo de velocidad móvil quedan documentados para etapa 7, sin extender esta etapa. Los bots sociales sin JavaScript pueden requerir SSR/prerender: aquí los enlaces funcionan con fallback SPA y los metadatos se actualizan en el cliente.

Sin despliegue, datos reales, correos o notificaciones automáticas. La autorización de subida de capturas a Drive es privada; no se habilita acceso público ni se comparte con terceros.
