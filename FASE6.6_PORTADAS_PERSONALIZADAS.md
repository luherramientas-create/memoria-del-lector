# FASE 6.6 — Portadas personalizadas de libros

## Objetivo
Permitir que cada libro tenga una portada opcional, almacenada localmente y optimizada para la biblioteca.

## Implementación
- Módulo independiente: `cover-manager.js`.
- Propiedad opcional del libro: `cover`.
- Persistencia en el mismo `localStorage` de V6 (`memoriaLector.v1`).
- Sin servidor externo ni subida de imágenes.
- Libros existentes sin `cover` conservan el icono genérico.

## Formatos
- JPG/JPEG
- PNG
- WebP

La imagen se procesa mediante `canvas` y se redimensiona hasta un máximo aproximado de 300×450 px. Se intenta guardar en WebP y se aplican reducciones de calidad/formato si es necesario para mantenerla optimizada, con objetivo de 250 KB.

## Interfaz
En crear/editar libro se dispone de:
- Seleccionar imagen.
- Previsualizar.
- Cambiar portada mediante una nueva selección.
- Eliminar portada.

La biblioteca muestra la portada en el espacio donde antes aparecía el icono del libro.

## Compatibilidad
No se modifican personajes, relaciones, sesiones, fragmentos, mapas ni la clave de almacenamiento. La funcionalidad se integra mediante un módulo desacoplado cargado después de `app.js`.

## Pruebas previstas
1. Libro existente sin portada.
2. Nueva portada JPG.
3. PNG.
4. WebP.
5. Cambiar portada.
6. Eliminar portada.
7. Recargar aplicación.
8. Varias portadas en varios libros.
9. Verificar que datos de personajes, relaciones, sesiones y fragmentos permanecen intactos.
10. Verificar mapa tradicional y mapa neuronal.
