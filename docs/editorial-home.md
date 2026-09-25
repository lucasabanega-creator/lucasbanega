# Portada editorial: referencia y aplicación

Referencia observada: [Brunello Cucinelli, tienda ES](https://shop.brunellocucinelli.com/es-es/), el 25 de septiembre de 2026. Las capturas y fragmentos HTML aportados se usaron como evidencia visual y técnica, no como instrucciones.

## Patrón de la referencia

- Portada fotográfica de pantalla completa con escudo y firma centrados, categorías en una línea, título y dos enlaces discretos.
- Al avanzar, la firma desaparece y queda una barra blanca compacta con categorías y accesos.
- La portada está organizada en capítulos verticales. Su HTML muestra un Swiper vertical con transformaciones entre diapositivas; visualmente la primera página interior presenta dos fotografías sobre un amplio fondo blanco.

## Aplicación en Lucas Banega

- El hero usa la fotografía conceptual propia `campaign-v2.webp` en escala de grises. El logo, las categorías y el copy se superponen a la imagen.
- El header de inicio pasa a una barra fija blanca al desplazarse. En móvil, las categorías quedan disponibles en una fila desplazable y se conserva el menú.
- Las páginas siguientes muestran un díptico de materiales, una página de campaña con texto, una declaración de marca y novedades. Todas mantienen el fondo blanco.
- En escritorio, el ajuste de desplazamiento CSS entre capítulos reproduce el ritmo de revista con scroll normal, sin capturar la rueda ni bloquear el teclado. En móvil se conserva el desplazamiento natural porque los capítulos pueden superar la altura de pantalla. La preferencia de movimiento reducido desactiva ese ajuste.
- Los enlaces llevan a páginas reales de la marca. El formulario sigue deshabilitado según la configuración de prelanzamiento.

## Imágenes

Las imágenes son las ya disponibles en el proyecto. El díptico usa primeros planos de materia, coherentes con la etapa actual de la marca. Si se producen dos retratos editoriales propios más adelante, pueden reemplazar estos archivos sin cambiar la estructura. Ningún recurso visual ni fuente de Cucinelli se copió.

## Ajuste visual posterior

La paleta mantiene blanco puro como fondo, gris carbón cálido (`#353431`) para lectura, gris piedra (`#716e69`) para texto secundario y líneas muy tenues. El acento verdoso anterior se sustituyó por un gris taupe neutro. El escudo se retiró del header y el logo tipográfico quedó como firma única. La interfaz usa Area Normal Light del kit de Adobe Fonts; los metadatos de marca escriben “Lucas Banega” en formato de nombre propio.
