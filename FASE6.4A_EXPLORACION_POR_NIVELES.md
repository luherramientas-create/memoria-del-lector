# FASE 6.4A — Exploración por niveles del mapa neuronal

## Objetivo
Añadir exploración visual por profundidad a partir de un personaje seleccionado, sin modificar los datos persistentes ni el mapa tradicional.

## Opciones
- **Toda**: muestra toda la red.
- **1**: personaje seleccionado y conexiones directas.
- **2**: hasta dos niveles de distancia.
- **3**: hasta tres niveles de distancia.

## Algoritmo
Se utiliza un recorrido BFS sobre la conectividad del grafo. Para esta función, la dirección semántica de una relación no impide considerar conectados a sus dos extremos. La distancia es la mínima dentro del grafo; múltiples relaciones entre el mismo par cuentan como un único vínculo de conectividad.

## Comportamiento
- Sin personaje seleccionado, la vista permanece en toda la red.
- Al seleccionar un personaje se puede elegir 1, 2 o 3 niveles.
- Los nodos y conexiones fuera de la profundidad se atenúan visualmente; no se eliminan del estado ni del DOM.
- Al deseleccionar, se vuelve a toda la red.
- Cambiar de personaje recalcula la profundidad desde el nuevo origen.
- Zoom, pan, arrastre de nodos, tooltips y reorganización se mantienen.

## Integridad
No se modifican `characters`, `relationships`, sesiones, fusión ni `localStorage`. El mapa tradicional permanece separado.

## Limitaciones
No se implementan todavía filtros por tipo de relación, comunidades, métricas, búsqueda ni análisis avanzados.

## Commit
`26f7cba524674f35460f435b445e71a53b6f1d69`
