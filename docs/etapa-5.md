# Etapa 5 · Administración y contabilidad

## Alcance

Se conserva la identidad oscura y lima de la etapa 2 mediante `zairo-admin.css`, los tokens existentes, navegación compartida por rol y componentes de estado y confirmación. Sin fuentes remotas ni dependencias nuevas. La portada y las páginas públicas no cambian. No se modifica el escáner, asignación de mesas ni beneficios.

Pantallas cubiertas: acceso, resumen, empleados, departamentos, conceptos, novedades, planillas, detalle/PDF, reportes, usuarios, eventos/editor, entradas por evento, códigos, compras pendientes, comprobantes y ventas/CSV. Formularios con etiquetas persistentes; tablas completas con desplazamiento horizontal y región accesible; navegación activa y menú móvil; foco visible, Escape y confirmación con foco inicial en Cancelar.

Las consultas comparten estados de carga, error recuperable, sesión/permisos y aviso. Los errores no se convierten en totales cero. Se mantienen las respuestas, filtros, exportaciones, acciones y confirmaciones originales. Los botones de confirmación siguen ejecutando los servicios originales.

## Permisos

Se conserva la matriz existente. Administración mantiene gestión; Contabilidad y RRHH mantienen sus recursos originales; Entrada mantiene su acceso al kiosco. El rol Visor tenía acceso frontend a Reportes pero la API de planillas lo rechaza: ahora muestra esta limitación explícitamente, sin consultar datos ni mostrar indicadores ficticios. Resolver esa política requiere una decisión posterior; esta etapa no concede permisos.

## Verificación

Cierre de etapa 4 revisado: commits frontend bf1b7cc / backend 1972b5e y smoke local de publicación/compra repetido satisfactoriamente antes de los cambios. Las limitaciones de carga lenta documentadas en etapa 4 permanecen y no se consideran resueltas aquí.

Pruebas unitarias frontend: 59 casos. Backend: 29 casos, incluyendo regresión de planilla y matriz de roles. Builds normal y optimizado local de verificación. Integración real con PostgreSQL y Chromium, con navegación externa bloqueada y cuentas ficticias. Ver resultados finales en el cierre de esta etapa.

No se realizan envíos de correo, despliegues ni mezclas. Notificaciones automáticas desactivadas. Capturas y datos temporales de pruebas quedan fuera del repositorio; las credenciales nunca se incorporan.

## Cierre verificado

Chromium 1440×1000 y 390×844: inicio de sesión para los cinco roles; matriz HTTP real de empleados, planillas, usuarios y ventas; rechazo de escrituras de usuarios para roles no administradores. Administración recorrió 13 pantallas, con etiquetas, sección activa y sin desbordamiento de página en móvil. Edición de un usuario ficticio; formularios de RRHH y foco de teclado; Visor sin solicitud a planillas ni tarjetas ficticias; Entrada redirigido al kiosco al intentar planillas. El kiosco conserva su navegación propia; no se verifican cámara ni lectura QR en esta etapa.

Contabilidad: filtro de estado, tabla completa de siete columnas desplazable, PDF válido y CSV con filas esperadas; creación, cancelación por Escape, procesamiento y confirmación de planilla ficticia. Rechazos 403 al invalidar entradas y confirmar compras. Error 503 simulado con reintento, carga demorada y filtro vacío verificados. Detalle contable idéntico al baseline anterior al rediseño: 33000 bruto, 2000 deducciones, 31000 neto. Venta ficticia de dos entradas: total 15000 sin variación. Estos valores son exclusivamente datos de prueba, no indicadores añadidos al producto.

18 PNG reales en el ZIP; cuatro principales y ZIP subidos a Drive tras autorización específica. Lectura posterior: shared=false y únicamente owner para los cinco archivos. Capturas tomadas antes de limpiar fixtures. Limpieza completa verificada en once tablas locales, sin incorporar datos ficticios a Git.

Limitaciones: comprobantes WhatsApp revisados en estado vacío (servicio no configurado); operaciones externas/envíos no ejecutados. No se certifica accesibilidad completa ni se prueba hardware móvil: revisión con Chromium y tamaños representativos. Se mantiene el comportamiento original de otros modales; el diálogo compartido de confirmación incluye ciclo de foco y Escape. No se modifican las limitaciones de velocidad de etapa 4.
