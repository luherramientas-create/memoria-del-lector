# FASE 5.1 — Auditoría móvil / PWA

## Estado
Auditoría documental. No se modificaron archivos funcionales.

## Resumen ejecutivo
La aplicación está razonablemente preparada como aplicación web móvil, pero la preparación PWA y la experiencia táctil requieren verificación específica en el dispositivo real. El punto de mayor riesgo funcional es el mapa: la interacción de relaciones se diseñó inicialmente alrededor de interacción con puntero/mouse y debe comprobarse en touch.

## Hallazgos

### 1. Viewport — 🟢
La estructura actual debe conservarse y verificarse en Android; no se identificó en esta auditoría evidencia suficiente para justificar un cambio funcional inmediato.

### 2. Responsive — 🟡
La interfaz usa tarjetas, grids, formularios y modales. Debe probarse en portrait y landscape en un Galaxy S24 para detectar desbordamientos y controles pequeños. No se recomienda modificar CSS sin prueba real.

### 3. Touch — 🟠
La interacción de mapa y tooltips es el principal punto a validar. El hover de escritorio no tiene equivalente directo en una pantalla táctil.

### 4. Mapa — 🟠
Recomendación: interacción táctil mediante **tap sobre la línea/relación**, mostrando únicamente el tooltip/panel de esa relación. Mantiene el mapa limpio y conserva la idea ya validada en escritorio. Como fallback, puede utilizarse pointer events en lugar de depender exclusivamente de mouse events.

### 5. Relaciones — 🟡
La aplicación soporta relaciones múltiples entre los mismos personajes y relaciones dirigidas/simétricas. La representación debe probarse táctilmente sin reintroducir etiquetas permanentes.

### 6. Formularios — 🟡
Los formularios son compatibles conceptualmente con Android, pero requieren prueba real con teclado virtual, scroll y modales altos.

### 7. Modales — 🟡
Debe verificarse que el contenido pueda desplazarse cuando el teclado reduzca el viewport disponible.

### 8. Persistencia — 🟢
La aplicación utiliza `localStorage`; esto permite persistencia local en el navegador/PWA, pero no sincronización entre dispositivos.

### 9. Datos entre dispositivos — 🟡
PC y Android mantienen almacenamiento local independiente. El mecanismo apropiado para la versión actual es Exportar → Importar, no introducir sincronización en la nube.

### 10. PWA — 🟠
Debe verificarse directamente la existencia y corrección de manifest, iconos, `start_url`, `display`, scope y Service Worker. La mera presencia de un Service Worker o localStorage no garantiza instalabilidad/offline.

### 11. Offline — 🟠
Debe comprobarse en dispositivo real qué recursos quedan cacheados y si la aplicación abre sin conexión. `localStorage` conserva datos, pero no hace que los archivos de la aplicación estén disponibles offline por sí solo.

### 12. Backup / restore — 🟡
El sistema existente de exportación/importación es la vía recomendada para trasladar la memoria entre PC y Android. Debe probarse desde Chrome Android.

### 13. Rendimiento — 🟢/🟡
No hay evidencia actual de un cuello de botella que justifique optimización preventiva. El mapa debe probarse con el volumen real de personajes/relaciones.

## Prioridades

| Prioridad | Hallazgo |
|---|---|
| 🔴 | Ninguno confirmado por auditoría de código |
| 🟠 | Mapa/touch; PWA instalable; offline |
| 🟡 | Responsive real; modales; formularios; backup/restore |
| 🟢 | Persistencia local; estructura general |

## Prueba real recomendada — Galaxy S24

1. Abrir la aplicación en Chrome Android.
2. Añadir a pantalla de inicio.
3. Abrir como PWA.
4. Crear/editar personaje.
5. Crear/editar relación.
6. Probar múltiples relaciones entre dos personajes.
7. Probar mapa en portrait.
8. Probar mapa en landscape.
9. Tocar una línea y comprobar tooltip.
10. Crear/editar sesión.
11. Abrir/cerrar modales con teclado visible.
12. Exportar respaldo.
13. Cerrar completamente.
14. Volver a abrir.
15. Confirmar persistencia.
16. Probar importación del respaldo.
17. Desactivar conexión y comprobar apertura/offline.

## Recomendación principal
Antes de modificar código, realizar la prueba física en el Galaxy S24. Si el mapa no responde correctamente al tacto, la primera modificación de FASE 5 debería ser adaptar la selección de relaciones a pointer/tap, conservando el mapa limpio.

## Roadmap propuesto

- **5.2 — Prueba real Android/PWA**
- **5.3 — Corrección táctil del mapa**, solo si falla
- **5.4 — Ajustes responsive**, solo según fallos observados
- **5.5 — PWA/install/offline**, según estado real de manifest y Service Worker
- **5.6 — Validación final Android**

## Regla
No realizar cambios preventivos. Cada modificación debe responder a un problema observado o a un requisito PWA comprobado.
