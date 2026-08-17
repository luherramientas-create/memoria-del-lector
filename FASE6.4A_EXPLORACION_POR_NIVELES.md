# FASE 6.4A — Exploración por niveles y distribución del mapa neuronal

## Estado

Implementada y experimental.

## Objetivo

Permitir explorar la red por profundidad (1, 2, 3 o toda la red) y mejorar la distribución inicial para reducir agrupamientos, superposiciones y la necesidad de arrastrar manualmente los personajes.

## Distribución

El mapa utiliza un layout de fuerzas mejorado con:

- repulsión entre nodos;
- atracción entre personajes conectados;
- separación mínima adicional considerando el ancho aproximado de las etiquetas;
- margen respecto a los bordes;
- enfriamiento progresivo de la simulación;
- resolución posterior de solapamientos;
- distribución inicial determinista mediante espiral de baja densidad;
- funcionamiento con distintos tamaños de grafo.

El layout solo modifica posiciones visuales. No modifica personajes ni relaciones.

## Exploración

Al seleccionar un personaje se puede elegir:

- **Toda**: red completa;
- **1**: conexiones directas;
- **2**: hasta dos niveles;
- **3**: hasta tres niveles.

La distancia se calcula mediante BFS sobre la conectividad del grafo. La dirección semántica de una relación se conserva para su representación, pero no impide recorrer el vínculo durante la exploración.

## Interacción conservada

- selección de personaje;
- tooltip de personaje y relación;
- zoom con rueda y controles;
- pan arrastrando el espacio vacío;
- arrastre individual de nodos;
- ajustar vista;
- reorganizar.

## Restricciones

No se modifican datos persistentes, personajes, relaciones, sesiones, fusión ni el mapa tradicional.

## Prueba recomendada

Abrir el mapa neuronal con el libro real y comprobar que los 21 personajes de prueba se distribuyen con separación suficiente desde el primer renderizado. Después probar selección, niveles 1–3, zoom, pan y arrastre manual.

## Commit

`f869f708a51aef1a301cbe0163827202bf565606`
