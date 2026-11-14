# Cierre y revisión de la etapa 5

Se conservan los commits anteriores (frontend 768ec26 / backend d231410). Sin despliegues ni cambios de etapa.

## Reproducción previa

Chromium, viewport 390×844, compilación optimizada local y PostgreSQL de desarrollo con datos exclusivamente ficticios:

- Resumen: `₡15,000`; Reportes: `33,000.00`; Ventas: `CRC 15 000,00`.
- Tarjetas de resumen de aproximadamente 138 px, en una sola columna por una regla móvil anterior con `!important`.
- Filas de entradas de aproximadamente 224–246 px: UUID y otras columnas fuera de pantalla se dividían en líneas, inflando toda la fila.
- Modal de empleados: 758 px visibles y 1082 px de contenido. Guardar era accesible al desplazar, pero estaba debajo del área inicial. Sin cierre superior.
- Refrescar conservaba un degradado morado/turquesa de su hoja local.
- Visor era enviado a Reportes aunque el backend deniega las planillas.

## Correcciones

`formatCRC` y `crcMoney` comparten `CRC 15 000,00`: código explícito, agrupación con espacios y dos decimales con coma. Administración, contabilidad, ventas, compras, comprobantes, precios y descuentos internos utilizan la misma función. Los campos numéricos, cálculos y payloads permanecen numéricos e intactos. PDF utiliza el mismo formato y espacios ASCII compatibles con su fuente. CSV conserva valores numéricos y añade CRC al encabezado de Precio; no introduce símbolos ni agrupación en los datos exportados.

La hoja compartida corrige la regla móvil de columnas, compacta indicadores y metadatos de planilla y evita cortes del UUID/textos en filas de entradas. Todas las columnas siguen disponibles mediante desplazamiento horizontal. Las acciones conservan objetivos de al menos 44 px.

El formulario de empleados tiene encabezado con Cerrar, cuerpo desplazable y acciones fuera del área de desplazamiento. La directiva de diálogo compartida administra foco inicial, ciclo de Tab, Escape, restauración de foco y área visible mediante VisualViewport. Mantiene la lógica de guardado y validación del servidor, con errores visibles dentro del diálogo; no agrega reglas ni cambia salarios.

Visor inicia en `/mi-acceso`, una pantalla neutral sin consultas a datos financieros y con cierre de sesión. Reportes ya no figura en su menú ni en sus rutas autorizadas. Se detectó además que `/api/dashboard` aceptaba cualquier JWT y exponía totales salariales a Visor/Entrada. Se reprodujo 200 con campos financieros y se restringió a admin/rrhh/contabilidad mediante el middleware existente. La comprobación HTTP posterior da 403 para Visor/Entrada y 401 sin sesión. No se amplían permisos backend. Administración, Contabilidad, RRHH y Entrada conservan sus rutas autorizadas.

Refrescar adopta estilo, hover, foco, carga y deshabilitado de Zairo. La interfaz y el método evitan solicitudes simultáneas; el error permite reintentar.

## Comprobaciones y límites

Pruebas: `npm test -- --watch=false` (62), backend `node --test` (30). Se agregó regresión del formato compartido, exclusión de refrescos simultáneos, navegación de Visor y CSV con moneda explícita/precios numéricos. El build backend sigue siendo un comando placeholder, no una compilación ni una prueba.

Revisión visual y recorridos realizados con Chromium en computadora y viewport de celular emulado. Un viewport 390×440 simula el área reducida por teclado; no se afirma prueba de teclado o hardware real. Las capacidades VisualViewport requieren revisión posterior en Safari/iOS y teléfonos físicos. No se certifica accesibilidad completa.

No se modifica escáner, asignación de mesas ni beneficios. No se envían correos ni se prueban servicios externos. Backend de desarrollo con LOCATION_NOTIFICATIONS_ENABLED=false. Las capturas muestran datos ficticios de verificación, fuera de Git.

## Resultado de integración

Recorridos reales con JWT de los cinco usuarios ficticios: inicio de sesión, navegación autorizada y rechazo de rutas no permitidas. Se comprobaron también vía HTTP dashboard, empleados, departamentos, planillas, novedades y conceptos para los cinco roles. Visor no solicita datos financieros y puede cerrar sesión desde su pantalla neutral.

Administración: 13 pantallas recorridas sin desbordamiento de página a 390 px y controles visibles con etiquetas (auditoría sobre `.content`, presente en todas las pantallas; el selector `main` utilizado en el chequeo anterior no cubría todas ellas). Refrescar sin degradado, foco visible, indicador de carga y una sola solicitud durante carga. Empleados: todos los campos alcanzables, acciones visibles a 390×440, rechazo del servidor para formulario incompleto, actualización válida y salario persistido sin cambio; Cancelar, Escape y recuperación del foco.

Contabilidad: filtro PROCESADA, vacío PENDIENTE, carga demorada y error 503 simulado con reintento; PDF descargado y leído mediante pdftotext, CSV descargado y analizado como CSV. PDF con bruto CRC 33 000,00, deducciones CRC 2 000,00, neto CRC 31 000,00 y montos por empleado. CSV con columna Precio (CRC), dos precios numéricos 7500 y total equivalente a 15000. Detalle persistido idéntico al baseline anterior y compra ficticia sin variación. No se confirma ninguna compra ni se envía ningún mensaje.

Medidas de laboratorio en el mismo viewport móvil: indicadores del resumen 137,5→114 px, indicadores de Reportes 104→76,8 px y metadatos de planilla 104→39–40 px. Filas de entradas confirmadas 224–246→51 px. La tabla conserva sus columnas y se verificó el desplazamiento hasta el extremo derecho. Son medidas del fixture, no garantías para cualquier volumen o longitud de texto.

Archivo ZIP con 20 capturas reales, incluyendo computadora/celular, estados y viewport reducido. Los archivos contienen únicamente datos ficticios de pruebas.

Cierre: prueba adicional de foco aprobada (Tab/Shift+Tab dentro del formulario, error del servidor enfocado y visible, Escape y retorno al botón de apertura). La actualización de foco se programa con afterNextRender, evitando intentar enfocar un mensaje aún no renderizado. Los siete PNG móviles principales y ZIP de 20 PNG se subieron a Drive con autorización específica; lectura posterior confirmó shared=false y únicamente owner en los ocho archivos. Se limpiaron usuarios, empleados, planillas, evento, entradas, compra y auditoría ficticios; once tablas locales verificadas vacías.

La revisión visual final detectó y corrigió también una prioridad CSS que oscurecía el botón primario al hacer hover. El botón Guardar conserva fondo lima y texto oscuro; se comprobó su estilo computado en Chromium y se renovaron la captura de formulario y el ZIP manteniendo los enlaces privados. Este último chequeo aislado de presentación usó respuestas GET vacías simuladas, después de limpiar la base; los recorridos funcionales previos usaron PostgreSQL real. Builds normal y de verificación repetidos satisfactoriamente para el ajuste CSS.
