# INFAMOUS — experiencia pública v2

Trabajo sobre `feat/infamous-home-redesign-v2`, partiendo de `17bb6072058247b3d14ee9210df454af48cb9e3e`. No requiere cambios de backend para el flujo actual. No se abrió una PR ni se realizó un merge a `main`.

## Diseño y comportamiento

- Home cinematográfico en carbón, negro y rojo, con paneles de cristal, bordes translúcidos y reflejos. Hero, información del evento, countdown, lineup, storytelling y acceso a entradas.
- El Home sigue consultando `obtenerEventosActivos()`, normalizando las respuestas array, `eventos` o `data`, filtrando fechas pasadas y ordenando por fecha. Fecha, nombre, ubicación, links y estado de venta usan el evento del backend.
- El universo visual INFAMOUS se muestra si el próximo evento tiene INFAMOUS en su nombre o si todavía no hay un evento publicado. Otro evento usa su nombre, descripción e imagen y no recibe este lineup. La fecha de fallback sigue siendo el 31 de octubre de 2026; no permite comprar por sí sola.
- Subtítulo: **El despertar de las almas**. El detalle comparte las fotos y las escenas del Home y conserva la ubicación secreta únicamente cuando viene publicada por el backend.
- Video: H.264, 720 × 1280, 24 fps, sin audio, inicio progresivo. De 21.429.285 a 1.298.513 bytes. Inicia silenciado en escritorio y móvil; con movimiento reducido comienza con imagen y permite reproducción manual. Tiene control para pausar/reproducir y respaldo ante un error de video.
- Fotos: 4BES, JUNNO, VARGAS, BARU y JOAO. JUNE queda con retrato por revelar porque su carpeta no contiene imágenes. Los nombres siguen las carpetas del pack.
- Accesibilidad básica: navegación semántica, enlaces para saltar contenido, estados de carga/error, foco visible, etiquetas asociadas a los campos, selección de zona con `aria-pressed` y respeto de movimiento reducido.

## Zonas y compra

`EventZoneSelector` recibe `zones`, `selectedKey` e `imageUrl` y emite `zoneSelected`. Las zonas y precios reales vienen de los tiers; el dibujo del escenario/pista es **conceptual**, sin coordenadas ni aforos oficiales inventados. Cuando faltan tiers aparece un placeholder sin permitir comprar.

La selección entra al método existente `seleccionarZona()`, elige la fase disponible y conserva su `id_tier`. Se mantienen las fases agotadas, futuras y cerradas para consultar sus estados; los tiers desactivados no aparecen. Elegir una zona sin disponibilidad elimina la entrada y el descuento anteriores. Recargar disponibilidad invalida una selección que dejó de estar disponible. Un evento con la venta cerrada no habilita compra.

Cantidad, asistentes, descuentos, creación de compra pendiente, cortesías del servicio existente y continuación por WhatsApp mantienen sus endpoints y estructura de payload. La selección conceptual no se añade a la compra como si fuera un asiento reservado.

Para integrar el mapa definitivo:

1. Pasar su imagen por el input `imageUrl`. El detalle deja preparado el campo **opcional y propuesto** `evento.mapa_imagen_url`; actualmente no se presupone que el backend lo entregue.
2. Añadir metadatos oficiales de zonas y coordenadas a un adaptador. Sustituir la inferencia existente por palabras clave en nombres de tiers cuando ese contrato esté disponible.
3. Conectar los elementos del plano a `zoneSelected` con la misma clave de zona. El checkout continúa usando el tier validado por el backend.

## Fuentes visuales

Se encontraron en la computadora los ZIP con los nombres solicitados, bajo `Documents/ZAIRO/INFAMOUS 2026`. Se trabajó con copias aisladas y se incorporaron únicamente versiones web, no los ZIP originales.

| Archivo nuevo en `public/assets/infamous/v2/` | Fuente |
| --- | --- |
| `hero.mp4` | `Pack diseño/hf_20260930_015841_b19597e3-9891-4482-83f3-a93c42ca2962.mp4` |
| `4bes.webp` | `DJ´s/4bes/DSC01601-Edit.jpeg` |
| `junno.webp` | `DJ´s/JUNNO/jn.PNG` |
| `vargas.webp` | `DJ´s/VARGAS/IMG_0080.JPG.jpeg` |
| `baru.webp` | `DJ´s/BARU/IMG_1212.PNG` |
| `joao.webp` | `DJ´s/JOAO/903F35BF-F831-45DE-BD0F-46621FA5DBBC.PNG` |
| `zairo-mark.webp` | `LOGOS/F3D148BF-DABD-4AC3-8E35-4AE950B3D7A5.png` |
| `infamous-mark.webp` | `LOGOS/C68A1818-D5A0-4D05-9A76-8CD35AC37AEF.png`, preparado para variantes posteriores |
| `portal.webp` | `ZAIRO CRONOMETRAJE/3.jpg` |
| `awakening.webp` | `ZAIRO CRONOMETRAJE/22.png` |
| `ritual.webp` | `ZAIRO CRONOMETRAJE/28.png` |

Retratos limitados a 960 × 1200 conservando proporción y orientación; WebP calidad 82. Escenas limitadas a 1600 × 1600, WebP calidad 84. Logo ZAIRO limitado a 256 × 256. Fotos de artistas entre 18.760 y 82.608 bytes. Las 35 imágenes del cronometraje se revisaron para elegir las escenas.

## Archivos cambiados

- `src/app/pages/public-eventos/public-eventos.{ts,html,css,spec.ts}`: rediseño completo, comportamiento dinámico y regresiones.
- `src/app/pages/public-evento-detalle/public-evento-detalle.{ts,html,css,spec.ts}`: coherencia visual, loader, errores recuperables, conexión del selector y protección de disponibilidad.
- `src/app/shared/infamous/infamous-experience.{ts,css}`: video, lineup y narrativa reutilizables.
- `src/app/shared/event-zone-selector/event-zone-selector.{ts,css}`: selector conceptual y contrato para el plano futuro.
- `public/assets/infamous/v2/*`: assets optimizados.
- `docs/INFAMOUS-REDESIGN.md`: decisiones, integración futura y validación.

## Validación

- `npm ci --no-audit --no-fund`: dependencias instaladas sin cambiar el lockfile.
- `npm run build`: aprobado. Sin errores de compilación, sintaxis de CSS ni exceso de presupuesto de estilos al finalizar.
- `npm test -- --watch=false --include="src/app/pages/public-eventos/*.spec.ts" --include="src/app/pages/public-evento-detalle/*.spec.ts"`: **11/11 pruebas públicas aprobadas**.
- `npm test -- --watch=false`: **21 aprobadas, 1 fallo preexistente** en `src/app/app.spec.ts`, que espera `Hello, frontend-planilla` en un `h1`. Se reprodujo ese mismo fallo en una copia del código original de la rama. El test y el componente raíz permanecen sin cambios.
- Revisión automatizada en Edge sobre el build de producción a 1440, 390 y 320 píxeles: assets decodificados, navegación Home → evento, zona → tier real, tiers desactivados ocultos, zona futura sin checkout, cantidad de asistentes, etiquetas del formulario y payload de compra. Sin errores JavaScript ni desbordamiento horizontal. Video real comprobado, silenciado, con pausa/reproducción.
- La compra se probó con backend simulado: no se creó una compra real, no se envió un mensaje y no se hizo un pago. La confirmación real de stock, descuentos, SINPE y WhatsApp requiere validación con el backend del entorno.
- `git diff --check`: aprobado.

## Pendientes y avisos previos

- Los avisos CommonJS de `canvg`, `core-js`, `raf`, `rgbcolor` y `html2canvas` pertenecen a las dependencias existentes de generación de documentos; no se modificaron esas dependencias.
- La instalación informó scripts pendientes de aprobación de paquetes existentes. No impidió compilar ni ejecutar las pruebas.
- La regla de edad existente calcula 17 años, mientras el mensaje dice más de 18. Se conserva la regla previa; confirmar con el responsable la edad mínima antes de cambiarla.
- Falta el retrato de JUNE y el contrato/plano real del recinto. El diseño muestra explícitamente estos pendientes.

## Probar localmente

En la copia habitual, guardar primero cualquier trabajo local si `git status` muestra cambios propios. Luego:

```powershell
cd C:\Users\Baru\Documents\ZAIROWEB\zairo-frontend
git fetch origin
git switch feat/infamous-home-redesign-v2
git pull --ff-only origin feat/infamous-home-redesign-v2
npm ci
npm start
```

Abrir `http://localhost:4200/home` y usar **Elegir mis entradas** cuando la venta esté abierta. No hace falta conocer ni hardcodear el ID del evento. Si no hay una venta abierta, se verá el estado correspondiente y el acceso a novedades.

Revisar escritorio/móvil, video y pausa, lineup, cuenta regresiva, zona disponible, zona próxima/agotada, cambio de cantidad y descuentos. El botón **Continuar por WhatsApp** crea una compra real en el backend configurado: utilizar datos autorizados si se hace una prueba real.

Para comprobar el build: `npm run build`. Para pruebas públicas: usar el comando de 11 pruebas de arriba. La suite completa seguirá mostrando el test previo del título hasta que se actualice por separado.

Para volver a la rama que se encontró inicialmente en esa copia local: `git switch fix/security-dependencies`. Esta tarea se trabajó en una carpeta separada y no cambió esa copia.

## Ajuste de navegación y nuevo intro

- Lineup y La experiencia usan fragmentos del router; también funcionan al repetir el mismo enlace sin recargar la página. Ambos quedan visibles a 320 px.
- Intro oficial añadido después de la presentación, antes del lineup: video vertical de 30,68 segundos, 720 × 1280, con audio y controles nativos. Carga al tocar Ver intro (preload none). Original: intro infamous.mp4.mp4, 111.460.714 bytes; versión web: 3.678.783 bytes. Poster extraído del mismo video.
- Comprobación real en Edge a 1440, 390 y 320 px: autoplay silenciado del hero, pausa/reproducción, enlaces repetidos, intro completo y ausencia de desbordamiento o errores JavaScript. Movimiento reducido y reproducción manual comprobados.
- Compilación directa Angular AOT aprobada. En esta sesión el build y el runner habitual de tests quedaron bloqueados por permisos de lectura de carpetas superiores del entorno; esta limitación no confirma un fallo de código. La comprobación de navegador utilizó una previsualización AOT de revisión. Las cifras de tests/build anteriores corresponden a la entrega anterior.

## JUNE, mapa oficial y precio vigente por zona

- JUNE: WhatsApp Image 2026-10-01 at 3.40.41 PM (4).jpeg del ZIP June.zip. Elegida por la luz roja, fondo oscuro y encuadre de DJ en acción; sustituye el retrato pendiente tanto en Home como en detalle. WebP: 25.162 bytes.
- Mapa: Stage minimalista.jpg del usuario convertido a event-map.webp, 293.944 bytes. Se usa en INFAMOUS si el backend no entrega otro mapa. General y VIP tienen botones sobre las zonas visibles y tarjetas accesibles debajo. Otros eventos y mapas del backend no reciben coordenadas del mapa INFAMOUS.
- Cada zona agrupa sus tiers internamente y muestra únicamente el precio DISPONIBLE actual. Se eliminó la línea de fases, precios futuros y mensajes de ahorro. No se inventan precios, fechas ni cupos.
- Disponibilidad consultada cada 60 segundos mientras la página está visible y no procesa una compra; el temporizador se limpia al salir. Cambiar el tier mantiene la zona seleccionada, usa el nuevo id_tier, elimina descuentos anteriores y avisa para revisar el total. Si no queda un tier disponible se oculta el checkout.
- Compilador Angular directo (app y specs): aprobado. Build y tests estándar intentados, bloqueados por Access is denied al resolver carpetas superiores del entorno. Pruebas de navegador con backend simulado comprueban General de 6000 a 8000, VIP de 12000 a 15000, renovación automática y payload del tier vigente; no se hace una compra real.
