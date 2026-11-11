# Etapa 3 — editor de eventos

Desde Eventos, crear un evento abre su editor privado en `/eventos/:id/editor`. En el listado, **Contenido y publicación** abre los existentes. Solo admin puede acceder; los guards y JWT existentes se conservan. Las etapas anteriores permanecen en Git.

El editor amplía el panel existente y usa los tokens de `zairo-system.css`, sidebar y header. La adopción de la identidad compartida se extiende únicamente a esta nueva pantalla. El resto del sistema y las páginas públicas no se rediseñan.

1. Editar metadata pública, historia y concepto.
2. Agregar/quitar artistas, biografías e imágenes. Galería con URL y descripción alternativa; sin proveedor nuevo de archivos.
3. Definir colores propios. Guardar valida contraste en el backend.
4. Ordenar con Subir/Bajar y ocultar las cuatro secciones prediseñadas; sus títulos son editables. No hay constructor libre ni HTML interpretado.
5. **Guardar borrador** persiste sin publicar; **Vista previa privada** permite revisar el contenido, incluidos cambios aún sin guardar claramente identificados.
6. Elegir borrador privado, anuncio Próximamente o página pública. Abrir ventas es una casilla independiente habilitada solo para página pública. Seleccionar portada/destacado y **Aplicar publicación** copia la versión guardada; se bloquea si hay cambios sin guardar.

Las fechas se editan explícitamente en hora de Costa Rica, independiente del huso del dispositivo. El preview identifica las ventas, no tiene checkout y nunca recibe la ubicación secreta. Si el evento es un anuncio, se explica que su exposición pública es solo nombre, fecha e imagen; el preview completo sigue siendo privado.

Los errores y conflictos no se presentan como guardados exitosos. Se conservan los cambios locales ante un 409 y se pide recargar. Los controles quedan deshabilitados durante el guardado/publicación para impedir que una respuesta marque como guardadas ediciones hechas durante la solicitud.

Comprobaciones: `npm run build` correcto; `npm test -- --watch=false` 47/47 (17 archivos); integración real HTTP/PostgreSQL y revisión Chromium en 1440×1000 y 390×844. Se comprobó persistencia de texto y orden al recargar, galería oculta, publicación de anuncio, permisos y ausencia de overflow. Las advertencias CommonJS existentes continúan. La cobertura completa de estados/migración/compra está documentada en `ZAIROOFFICIAL/docs/etapa-3.md`.

Capturas de editor y vista previa con contenido ficticio en ambos tamaños; todos los fixtures se eliminaron. No hubo despliegue, correos, notificaciones automáticas ni conexión con producción. Las solicitudes externas del navegador se bloquearon durante las pruebas.

La integración de contenido, destacado y páginas sin venta en la portada/páginas públicas queda para etapa 4. La preview es una representación editorial, no una promesa del diseño final de cada megaevento. No hay historial editorial ni publicación programada; guardar antes de salir o recargar. Sin nuevas dependencias ni cambios de lockfiles.
