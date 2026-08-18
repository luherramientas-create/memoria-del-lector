# FASE 7.1 — Mapa móvil en pantalla completa

## Objetivo
Añadir un modo ampliado para el mapa en pantallas pequeñas sin modificar la lógica del mapa ni los datos.

## Implementación
- Módulo independiente: `mobile-map-fullscreen.js`.
- Estilos limitados a `@media (max-width: 820px)` para el modo ampliado.
- Botones `⛶ Pantalla completa` y `↙ Volver al mapa`.
- No depende de la Fullscreen API.
- El estado del mapa no se reinicializa al entrar o salir.
- En escritorio el control permanece oculto.

## Alcance
No se modificaron personajes, relaciones, sesiones, localStorage ni algoritmos del mapa.

## Pruebas pendientes
La validación final debe realizarse en un dispositivo Android real, comprobando portrait, landscape, zoom, pan, selección, niveles y salida del modo ampliado.

## Limitación conocida
El modo ampliado se implementa como una vista fija dentro de la aplicación, no como fullscreen nativo obligatorio del sistema operativo.
