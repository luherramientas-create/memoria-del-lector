# FASE 4 — Auditoría de arquitectura interna

**Memoria del Lector V5**

## Resultado

Esta fase se ejecutó como **auditoría**, sin refactorización funcional. No se modificó el modelo de datos ni la lógica aprobada de relaciones, sesiones, mapa, importación/exportación o fusión.

## 1. Inventario observado

El proyecto carga `app.js` y después siete scripts auxiliares en este orden:

1. `app.js`
2. `map-labels.js`
3. `backup.js`
4. `duplicate-manager.js`
5. `character-name-guard.js`
6. `relationship-guard.js`
7. `delete-manager.js`
8. `session-manager.js`

La aplicación utiliza numerosas funciones globales porque `app.js` las expone mediante `window.*` y porque el HTML generado contiene handlers inline como `onclick="..."` y `onsubmit="..."`.

## 2. Hallazgo principal — sobrescrituras entre módulos

La arquitectura depende actualmente del orden de carga y de funciones globales sobrescritas.

### Mapa

`app.js` define y expone `renderMap`.

Después `map-labels.js` captura:

`const original=window.renderMap;`

y reemplaza:

`window.renderMap=function(){...}`

Esto es monkey-patching deliberado. Actualmente funciona, pero significa que el comportamiento final de `renderMap` depende de que `map-labels.js` se cargue después de `app.js`.

### Edición de personajes

`app.js` define `editCharacter`.

Después `delete-manager.js` guarda la versión anterior y reemplaza:

`window.editCharacter=function(id){...}`

Por tanto, la versión efectiva depende de `delete-manager.js`.

### Creación/edición de personajes

`app.js` define `createCharacter` y `updateCharacter`.

Después `character-name-guard.js` vuelve a definir y exponer ambas funciones:

`window.createCharacter=createCharacter`

`window.updateCharacter=updateCharacter`

La detección de nombres similares funciona porque esta sustitución ocurre después de `app.js`.

### Fusión

`app.js` contiene `openCharacterMerge`, `mergeCharacters`, etc. y los expone globalmente.

`duplicate-manager.js` vuelve a definir y exponer funciones con los mismos nombres, incluyendo:

- `characterDuplicateDiagnostics`
- `compareCharacters`
- `openCharacterMerge`
- `mergeCharacters`
- `setMergeSource`

Por tanto, la implementación de `duplicate-manager.js` reemplaza la implementación previa de `app.js`.

### Sesiones

`app.js` contiene más de una implementación histórica de funciones de sesiones dentro del mismo archivo. Más adelante en el mismo archivo vuelven a aparecer funciones como:

- `renderSessions`
- `newSession`
- `createSession`
- `editSession`
- `updateSession`
- `viewSession`

Además, `session-manager.js` define nuevamente estas APIs y las utiliza globalmente.

Este es actualmente uno de los puntos arquitectónicos de mayor riesgo.

## 3. Dependencias globales importantes

Varios módulos auxiliares dependen directamente de funciones definidas en otros módulos o en `app.js`.

Ejemplos observados:

- `backup.js` utiliza `state`, `migrate`, `render`, `modal`, `close` y `toast`.
- `duplicate-manager.js` utiliza `active`, `save`, `renderCharacters`, `toast`, `modal` y otras funciones globales.
- `character-name-guard.js` utiliza `active`, `esc`, `modal`, `save`, `renderCharacters`, `uid`, `updateCharacter`, etc.
- `relationship-guard.js` instala un listener global de `submit` en fase de captura y utiliza `active`, `modal`, `toast` y `relationshipExists`.
- `delete-manager.js` depende de `active`, `modal`, `save`, `renderCharacters`, `toast` y reemplaza `editCharacter`.
- `session-manager.js` depende de `active`, `modal`, `close`, `save`, `renderSessions`, `inferRel`, `relTypes`, `relationshipExists`, `relationshipLabelNormalize` y otros símbolos globales.

## 4. Dependencia del orden de carga

La dependencia es **alta**.

El orden actual de `index.html` no es accidental: cambiarlo puede alterar qué implementación queda finalmente instalada en `window`.

Ejemplos críticos:

- `app.js` → `map-labels.js`
- `app.js` → `duplicate-manager.js`
- `app.js` → `character-name-guard.js`
- `app.js` → `delete-manager.js`
- `app.js` → `session-manager.js`

Por ahora, **NO debe reordenarse `index.html`**.

## 5. Clasificación de riesgo

### 🟢 FASE 4A — Bajo riesgo

1. Documentar APIs globales públicas.
2. Eliminar implementaciones históricas duplicadas dentro de `app.js` después de crear pruebas de regresión.
3. Centralizar helpers puros que no dependan de DOM ni estado.
4. Crear un namespace de compatibilidad progresivo, sin eliminar inmediatamente `window.*`.

### 🟡 FASE 4B — Riesgo medio

1. Extraer las APIs de personajes a un módulo controlado.
2. Extraer las APIs de relaciones.
3. Extraer las APIs de sesiones.
4. Convertir progresivamente handlers inline a listeners registrados por módulo.

### 🟠 FASE 4C — Riesgo alto

1. Eliminar monkey-patching de `renderMap`.
2. Eliminar la sustitución de `editCharacter` por `delete-manager.js`.
3. Eliminar la sustitución de `createCharacter/updateCharacter` por `character-name-guard.js`.
4. Unificar las implementaciones de sesiones.
5. Unificar las implementaciones de fusión.

### 🔴 NO TOCAR TODAVÍA

- `state` y su modelo de persistencia.
- `migrate()`.
- estructura de `relationships`.
- estructura de `sessions`.
- `mergeCharacters()` hasta completar una API interna estable.
- lógica del mapa aprobada en FASE 3.
- importación/exportación.
- Service Worker salvo cuando una futura modificación lo requiera.

## 6. Recomendación arquitectónica

La dirección recomendada es pasar progresivamente de múltiples funciones globales independientes hacia una API interna única, por ejemplo:

`window.MemoriaLector = { characters, relationships, sessions, map, backup, merge }`

Pero **no se debe realizar esta migración completa en una sola fase**.

Primero debe existir una capa de compatibilidad que permita que los handlers actuales sigan funcionando.

## 7. Primera intervención recomendada

La primera intervención segura debería ser **eliminar duplicaciones internas de `app.js`**, empezando por las funciones de sesiones que aparecen más de una vez, pero únicamente después de identificar cuál implementación es la efectiva actualmente gracias a `session-manager.js`.

Después conviene introducir una pequeña API interna para evitar que los módulos auxiliares tengan que modificar `window` directamente.

## 8. Decisión de esta fase

**NO SE REFACTORIZÓ CÓDIGO FUNCIONAL EN ESTA FASE.**

La razón es deliberada: las FASES 1–3 están funcionando y la arquitectura actual contiene dependencias implícitas que hacen peligroso hacer una limpieza masiva sin pruebas automatizadas.

La FASE 4 queda como:

> 🟡 **AUDITORÍA COMPLETADA — REFACTORIZACIÓN PENDIENTE**

## 9. Pruebas de regresión recomendadas antes de FASE 4A

Antes de eliminar cualquier sobrescritura, verificar:

- crear personaje;
- editar personaje;
- advertencia de nombre similar;
- crear relación;
- detectar relación duplicada;
- crear sesión;
- agregar varios personajes a una sesión;
- agregar relaciones a una sesión;
- editar sesión;
- eliminar personaje;
- mapa Enfoque;
- mapa Red;
- tooltip de relaciones;
- exportar biblioteca;
- importar biblioteca;
- fusión de personajes;
- transferencia de relaciones;
- transferencia de sesiones.

**Conclusión:** la arquitectura funciona, pero actualmente depende de composición por sobrescritura global. La siguiente mejora debe ser incremental y reversible.