# Identidad permanente de ZAIRO — etapa 2

La marca conserva los fondos oscuros, cristal, bordes luminosos y verde lima existentes. El contenido de cada megaevento conserva su dirección artística (por ejemplo, INFAMOUS en carmesí). La marca no depende de Lost Trip ni de una campaña temporal.

## Fundaciones

`src/styles/zairo-system.css` define tokens CSS disponibles sin dependencias. La aplicación inicial está limitada a la portada pública y Eventos, con clases de adopción `.zairo-ui` y `app-eventos.zairo-screen`. Los componentes de otras pantallas conservan sus estilos. El nombre y símbolo de marca del sidebar compartido se actualizaron a Zairo; no cambian sus permisos.

| Uso | Token | Valor |
| --- | --- | --- |
| Fondo | `--z-bg` | `#080b0a` |
| Superficie | `--z-surface` | `#111815` |
| Elevación | `--z-raised` | `#18221c` |
| Texto | `--z-text` | `#f3f6ef` |
| Texto secundario | `--z-muted` | `#b6c3b8` |
| Borde | `--z-line` | `#465449` |
| Borde de control | `--z-control-line` | `#65776a` |
| Acción / foco | `--z-accent` | `#c6ff57` |
| Texto sobre lima | `--z-ink` | `#101708` |
| Error | `--z-danger` | `#ffb4b4` |
| Éxito | `--z-success` | `#b5ecc5` |
| Advertencia | `--z-warning` | `#f5d69b` |

Tipografía de interfaz: Segoe UI, Arial, sans-serif. No hay fuentes descargadas ni dependencias nuevas. Las formas exactas pueden variar entre sistemas operativos. Se eliminaron los enlaces Google Fonts del documento inicial; el build mantiene inlining desactivado. El loader inicial identifica Zairo, sin nombre de megaevento.

Botones: altura mínima 44 px; primario lima con tinta oscura, secundario de superficie y acciones destructivas con texto/borde rojo. Disabled reduce opacidad y muestra cursor correspondiente. Foco visible de 3 px con separación de 4 px. No depender únicamente del color para indicar estados.

Formularios: etiquetas persistentes, campos de 48 px y texto de 16 px, dos columnas en escritorio y una en móvil. Estados de carga con `role=status`, errores con `role=alert` y reintento. Eventos distingue error, carga y lista vacía; un error no se presenta como ausencia de eventos.

Navegación pública: menú desplegable bajo 900 px, estado `aria-expanded` y cierre al seleccionar enlace. Administración reutiliza el menú responsive existente; ancho corregido en Eventos y ocultamiento del botón móvil en escritorio. Las tablas mantienen scroll horizontal dentro de su región con nombre accesible y foco de teclado; no se transforman en tarjetas ni se cambian sus acciones.

## Validación y alcance

Capturas con Chromium a 1440×1000 y 390×844, usando un evento ficticio interceptado solo en el navegador y requests externos bloqueados. Se revisaron portada, menú móvil, formulario/listado administrativo, carga, error, reintento y vacío. No se cargaron datos visuales de muestra a producción. La comprobación de integración separada usa la base local y elimina sus fixtures.

La personalidad editorial existente, compras, servicios, payloads, autenticación, guards y reglas por rol permanecen. No se implementa editor de contenido, configuración de portada, contabilidad, ni ledger del escáner. No hay despliegue. Las advertencias CommonJS de jsPDF siguen pendientes; no se hizo una auditoría completa WCAG ni una prueba sobre dispositivos físicos.

Contrastes calculados sobre colores sólidos: texto/superficie 16.51:1, secundario/superficie 9.86:1, tinta/botón lima 15.54:1, error/superficie 10.67:1 y borde de control/superficie 3.78:1. No certifican contraste de cada píxel sobre el arte dinámico de megaeventos.

Resultado de esta sesión (10 noviembre 2026): build correcto, 44/44 pruebas frontend en 16 archivos, smoke visual sin errores JavaScript y smoke real PostgreSQL/JWT/roles correcto. Las advertencias de build corresponden a dependencias CommonJS existentes. Diff verificado respetando CRLF de los archivos originales. Capturas en `/workspace/work/stage2-captures/`; logs de comprobación en `/workspace/work/stage2-*.log`. No se incluyen fixtures, contraseñas ni capturas en Git.
