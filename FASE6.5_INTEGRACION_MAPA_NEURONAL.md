# FASE 6.5 — Integración del mapa neuronal en Memoria del Lector V6

## Objetivo
Integrar el mapa neuronal existente como una segunda visualización del módulo de mapas, sin modificar el modelo persistente ni la lógica de personajes, relaciones, sesiones, fragmentos o fusión.

## Decisión
Se conserva `neural-map-real.html` como módulo experimental independiente. El acceso desde la aplicación se mantiene explícito para evitar duplicar la lógica del mapa neuronal dentro de `app.js`.

## Estado
- Mapa tradicional: estable y sin cambios funcionales.
- Mapa neuronal: accesible desde la aplicación y utiliza el mismo `localStorage` (`memoriaLector.v1`) y libro activo.
- No se crea una base de datos paralela.
- No se modifica el esquema persistente.

## Alcance
Esta fase no implementa filtros, comunidades, estadísticas ni nuevas funciones del mapa neuronal.

## Verificación pendiente
La integración debe comprobarse en navegador después de publicar el commit, especialmente la navegación entre ambos mapas y la actualización de datos reales.
