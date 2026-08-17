# FASE 6.2 — Mapa neuronal con datos reales

## Estado

🟢 Implementación experimental completada.

## Objetivo

Conectar el prototipo neuronal de FASE 6.1 con los datos reales del libro activo sin modificar el modelo de datos ni sustituir el mapa existente.

## Implementación

Se creó `neural-map-real.html` como visualización experimental independiente.

La página lee directamente el estado persistido bajo la clave `memoriaLector.v1` y obtiene el libro activo mediante `activeBookId`.

El mapa deriva visualmente:

- personajes → nodos;
- relaciones → conexiones;
- `items` / `types` → información del tooltip;
- `mode: symmetric` → relación bidireccional;
- `mode: directed` → flecha en la dirección real `from → to`.

No se escriben cambios en `localStorage`.

## Relaciones múltiples

Las relaciones entre el mismo par de personajes se agrupan en una sola conexión visual.

El tooltip muestra todas las relaciones de esa conexión.

Cuando una relación es dirigida, el tooltip conserva los extremos reales. Si existen direcciones opuestas entre el mismo par, la conexión visual utiliza flechas en ambos extremos.

## Interacción

- Arrastrar nodos.
- Reorganizar la red.
- Hover sobre una conexión para consultar sus relaciones.
- Hover sobre un personaje para consultar nombre y primera aparición.
- Click sobre un personaje para resaltarlo y atenuar el resto de la red.
- Segundo click para quitar la selección.

## Integración

Se añadió un acceso experimental `🧠 Mapa neuronal` en `index.html`.

El mapa actual (`renderMap()`) no fue sustituido ni eliminado.

## Protección del modelo de datos

No se modificaron:

- personajes;
- relaciones;
- sesiones;
- fusión;
- `state`;
- `save()`;
- `active()`;
- `mergeCharacters()`.

## Limitaciones actuales

- El layout es deliberadamente experimental.
- No hay filtros por tipo de relación.
- No hay exploración por profundidad.
- No hay detección automática de comunidades.
- No hay métricas de centralidad.
- La interacción táctil no es objetivo de esta fase.
- No se ha optimizado para cientos o miles de personajes.

## Pruebas requeridas en navegador

1. Abrir la aplicación.
2. Abrir `🧠 Mapa neuronal`.
3. Confirmar que aparecen los personajes del libro activo.
4. Confirmar conexiones.
5. Probar relaciones dirigidas y bidireccionales.
6. Probar múltiples relaciones entre el mismo par.
7. Probar tooltip.
8. Seleccionar un personaje.
9. Arrastrar nodos.
10. Reorganizar.
11. Volver al mapa actual y confirmar que sigue funcionando.

## Próxima fase posible

Si el usuario considera que la visualización con datos reales es útil, FASE 6.3 puede centrarse en mejorar la experiencia de exploración: foco de personaje, profundidad de conexiones, filtros y refinamiento visual.
