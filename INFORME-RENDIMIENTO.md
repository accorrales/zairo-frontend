# Informe de rendimiento — Carrusel/secuencia de scroll de ZAIRO

Fecha: 2026-06-22

## TL;DR (respuesta corta a tu pregunta)

**No es por el plan de Vercel.** Aunque pagaras el plan más caro, la página se
sentiría **igual de trabada**. El problema está en la **aplicación**, en dos
cosas concretas:

1. **Las imágenes pesan muchísimo.** La secuencia del scroll son 16 fotos que en
   total pesan **33 MB**, y los archivos `.jpg` en realidad están guardados como
   **PNG** (el peor formato para fotos). Sumando el loader, la página arranca
   bajando **~38 MB** de imágenes.
2. **El motor de la animación (el `<canvas>`) trabaja de más.** Redibuja a 60 fps
   *aunque no estés haciendo scroll* y *aunque la sección ni se vea en pantalla*,
   y en cada cuadro hace consultas y escrituras al DOM que obligan al navegador a
   recalcular estilos. Encima, arriba del canvas hay varias capas con
   `blur(88–95px)` animadas, que es de lo más caro que existe para la GPU del
   celular.

Ya dejé las mejoras hechas y medidas. **Resultado: de ~38 MB a ~2.2 MB de
imágenes (−94%)** y el canvas ahora solo trabaja cuando de verdad hace falta.

---

## ¿Por qué NO es Vercel?

Vercel sirve los archivos estáticos (todo lo que está en `/public`: la secuencia
y los assets) desde su **CDN global (Edge Network)** en **todos los planes,
incluido el gratis (Hobby)**. La velocidad de entrega de un archivo estático a un
visitante es **la misma** en Hobby que en Pro o Enterprise.

Lo que te dan los planes pagos es: más **ancho de banda mensual** (cuota), más
minutos de build, más ejecución de *serverless/edge functions*, analítica
avanzada, miembros de equipo, etc. **Nada de eso hace que una foto de 2.5 MB baje
o se decodifique más rápido** en el celular de un usuario.

Traducción: el cuello de botella es el **peso de lo que mandás** y el **trabajo que
hace el navegador**, no el plan del hosting. Por eso la solución es 100% del lado
del código y de los assets (que es lo que arreglé).

> Lo único de Vercel que sí ayuda — y es **gratis** — es poner cabeceras de
> caché largas para que las visitas repetidas no vuelvan a bajar las imágenes.
> Te dejé un `vercel.json` listo para eso (ver más abajo). Pero eso mejora la
> *segunda* visita, no la causa del traveo.

---

## Diagnóstico detallado (qué encontré en el código)

Archivo del carrusel: `src/app/pages/public-eventos/`

### 1. Imágenes enormes y en formato equivocado  ← causa #1
- 16 cuadros en `public/secuencia/`, cada uno **1.7–2.7 MB**, total **33 MB**.
- Están nombrados `frame-XXX.jpg` pero **son PNG** (formato sin pérdida, pensado
  para logos/gráficos, no para fotos). Una foto en PNG pesa ~10× más que en JPG o
  WebP.
- Hasta que no se bajan y **decodifican** los 16 cuadros, el scroll se siente
  entrecortado porque los cuadros aún no están listos para dibujarse.
- Loader extra pesado: `zairo-loader-ring.png` (2.1 MB), `zairo-loader-logo.png`
  (1.1 MB), `plano-lost-trip.png` (2.1 MB).

### 2. Bug: falta un cuadro de la secuencia
El código pide `frame-010.jpg` (con `padStart(3,'0')`), pero el archivo real se
llama `frame-0010.jpg` (con un cero de más). O sea, **el cuadro 10 da 404** hoy y
la animación pega un saltito ahí. Ya quedó corregido (renombrado a `frame-010`).

### 3. El bucle de render nunca descansa
En `public-eventos.ts`, `renderSequenceLoop()` se vuelve a programar con
`requestAnimationFrame` **siempre**, sin condición de salida. Consecuencias:
- Redibuja el canvas **a 60 fps aunque estés quieto** y aunque la sección de la
  secuencia ya quedó muy arriba (fuera de pantalla).
- Gasta batería y CPU/GPU compitiendo con el scroll del resto de la página.

### 4. Trabajo de DOM en cada cuadro (60 veces por segundo)
`updateSequenceVisualState()` hacía, en **cada** frame:
- `section.querySelector('.sequence-progress-count')` (buscar en el DOM),
- `classList.toggle(...)` dos veces,
- `style.setProperty('--sequence-progress', ...)`.

Cambiar una variable CSS que usan muchos elementos obliga al navegador a
**recalcular estilos** constantemente → micro-traveos.

### 5. Capas con blur gigante encima del canvas
Sobre el canvas (que ya se redibuja a 60 fps) hay orbes y niebla con
`filter: blur(88–95px)` **animados en bucle infinito**, más ruido y hojas. Un
desenfoque animado **se recompone en cada cuadro**: en una GPU de celular de gama
media eso solo ya te tira los fps al piso.

### 6. Detalles menores
- `console.log('EVENTOS RECIBIDOS', ...)` quedó en producción.
- El loader de intro estaba con un `setTimeout` fijo de **5 segundos**, sin
  importar si las imágenes ya habían cargado.
- `iniciarScrollReveal()` se llamaba 3 veces.
- El DPR del canvas estaba en 2× (renderiza el doble de píxeles del necesario para
  un fondo estilizado).

---

## Qué cambié

### A) Imágenes (lo de mayor impacto)
Reconvertí todo con `sharp` (mismo tamaño 941×1672, calidad alta):

| Archivo | Antes (PNG) | Después JPG | Después WebP |
|---|---:|---:|---:|
| Secuencia (16 cuadros) | **33.0 MB** | ~2.8 MB | **~1.9 MB** |
| `zairo-loader-ring` | 2.1 MB | 0.12 MB | 0.09 MB |
| `zairo-loader-logo` | 1.1 MB | 0.09 MB | 0.11 MB |
| `plano-lost-trip` | 2.1 MB | 0.21 MB | 0.15 MB |
| **TOTAL** | **38.0 MB** | **3.1 MB** | **2.2 MB** |

➡️ **−92% en JPG / −94% en WebP.** Te dejé **los dos formatos**:
- Los `.jpg` tienen el **mismo nombre** que los actuales → podés solo reemplazar
  los archivos en `public/secuencia/` y `public/assets/` **sin tocar una línea de
  código** y ya bajás de 38 MB a 3 MB.
- Los `.webp` son aún más livianos; el código nuevo los usa automáticamente y
  cae a `.jpg` solo si el navegador no soporta WebP.

### B) `public-eventos.ts` (motor de la animación)
- **El bucle se pausa** cuando la animación llega a su destino y cuando la sección
  sale de pantalla (con `IntersectionObserver`). Se despierta solo al hacer scroll.
- **Cero trabajo de DOM redundante:** se cachea el elemento del contador y solo se
  escribe `textContent` / la variable CSS / las clases **cuando el valor cambió**.
- Los listeners de scroll/resize y el `requestAnimationFrame` corren
  **fuera de la zona de Angular** (`runOutsideAngular`) → no disparan detección de
  cambios en cada scroll.
- **WebP con fallback a JPG** automático.
- **DPR limitado a 1.5×** (menos píxeles que rellenar; baja mucho el costo en
  celulares).
- `imageSmoothingQuality` de `'high'` a `'medium'` (se ve casi igual, cuesta menos).
- **Respeta `prefers-reduced-motion`**: si el usuario pidió menos animación, se
  pinta un cuadro fijo y no se anima.
- El loader de intro se oculta **apenas el primer cuadro está listo** (con tope de
  3.5 s como red de seguridad), ya no espera 5 s a ciegas.
- Quité el `console.log` y la triple llamada a `iniciarScrollReveal()`.

### C) `public-eventos.css` (bloque nuevo al final)
- Pista de capa GPU para el canvas (`will-change`, `translateZ(0)`, `contain`).
- `@media (prefers-reduced-motion: reduce)`: corta las animaciones infinitas.
- `@media (max-width: 900px)`: baja el blur de orbes/niebla (de 88–95px a ~42–45px)
  y **detiene su animación** (así el navegador puede cachear la capa en vez de
  recomponerla en cada cuadro). Es el cambio que más se nota en celular.

> No toqué el HTML ni el diseño visual: se ve igual, solo más fluido.

---

## Cómo aplicarlo (paso a paso)

> Recordá: yo no puedo hacer push (sin permisos), así que esto lo aplicás vos en
> tu repo `zairo-frontend` y luego hacés tu commit/deploy normal en Vercel.

**Opción rápida (solo imágenes, sin tocar código) — ya baja de 38 MB a 3 MB:**
1. Copiá los `.jpg` de `public/secuencia/` de este paquete sobre los de tu repo
   (reemplazando). Ojo: agregá el nuevo `frame-010.jpg` y podés borrar el viejo
   `frame-0010.jpg`.
2. Copiá los archivos de `public/assets/` (reemplazando los `.png` del loader).
3. Commit + push → Vercel redeploya.

**Opción completa (recomendada) — además arregla el traveo del motor:**
4. Reemplazá también `src/app/pages/public-eventos/public-eventos.ts` y
   `public-eventos.css` por los de este paquete.
5. Copiá también los `.webp` a `public/secuencia/` y `public/assets/` (el código
   nuevo los prefiere y cae a `.jpg` solo si hace falta).
6. (Opcional) Copiá `vercel.json` a la raíz del repo para caché larga en visitas
   repetidas.
7. `npm run build` para verificar, luego commit + push.

**Para futuras secuencias / fotos nuevas:** te dejé `optimizar-imagenes.mjs`. Con
`npm i -D sharp` y `node optimizar-imagenes.mjs` (ajustando las rutas de arriba)
reconvertís cualquier set nuevo de cuadros sin volver a pelear con el tamaño.

---

## Impacto esperado
- **Carga inicial:** de ~38 MB a ~2.2 MB de imágenes → arranca muchísimo más rápido,
  sobre todo en datos móviles.
- **Scroll:** sin redibujos en vacío, sin recalcular estilos por cuadro y con menos
  blur animado en celular → la secuencia se siente fluida en vez de "travadilla".
- **Sin cambios visuales** en el diseño.

## Lo que queda fuera de este paquete (ideas a futuro, opcionales)
- Bajar el `<img>` del hero y de cada tarjeta de evento con `loading="lazy"` y un
  tamaño servido más chico (hoy salen de Unsplash a tamaño completo).
- Considerar usar el componente `NgOptimizedImage` de Angular para esas imágenes.
- Si querés una secuencia aún más fina, se puede subir a 24–32 cuadros *ya que ahora
  pesan poco* — quedaría más cinematográfica sin penalizar la carga.
