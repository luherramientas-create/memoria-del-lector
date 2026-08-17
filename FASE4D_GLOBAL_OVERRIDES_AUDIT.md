# FASE 4D — Auditoría de sobrescrituras globales entre módulos

## Alcance

Auditoría estática conservadora del estado actual del repositorio. No se realizaron cambios funcionales ni se eliminaron globals o wrappers.

## Orden de carga confirmado

`index.html` carga, en este orden:

1. `app.js`
2. `map-labels.js`
3. `backup.js`
4. `duplicate-manager.js`
5. `character-name-guard.js`
6. `relationship-guard.js`
7. `delete-manager.js`
8. `session-manager.js`

Este orden es arquitectónicamente relevante porque varios módulos consumen o reemplazan APIs creadas por módulos anteriores.

## Globals principales de app.js

`app.js` establece el núcleo global: `state`, `save`, `uid`, `active`, `esc`, `modal`, `close`, `toast`, `inferRel` y otras funciones de aplicación. `migrate()` también forma parte del núcleo.

### Estado

🔴 `state`, `save()`, `active()` y `migrate()` quedan congelados según las reglas de FASE 4.

## Sobrescrituras / wrappers confirmados

### 1. `renderMap()` — 🟠 DELICADA

`map-labels.js` captura `window.renderMap` como `original` y posteriormente instala un wrapper:

- llama primero a la implementación original;
- después ejecuta `apply()` mediante varios `setTimeout`;
- `apply()` modifica la representación visual del mapa, colapsa pares y agrega interacción/tooltip.

Clasificación: 🟠 porque afecta directamente al mapa y depende del orden de carga.

Recomendación: no tocar todavía.

### 2. `editCharacter()` — 🟡/🟠 CONTROLADA

`delete-manager.js` captura `window.editCharacter` en `originalEdit` y luego instala una nueva función global. La nueva implementación presenta el editor enriquecido con eliminación y conserva `originalEdit` como fallback cuando no encuentra el personaje.

Esto es un wrapper intencional, no una sobrescritura destructiva pura.

Clasificación: 🟡/🟠 porque afecta la edición de personajes y puede ser utilizada desde HTML y otros módulos.

Recomendación: candidata arquitectónica futura, pero no primera intervención.

### 3. `createCharacter()` y `updateCharacter()` — 🟡 CONTROLADAS

`character-name-guard.js` define y expone versiones que incorporan detección de nombres exactos/similares antes de delegar a `createDirect()` / `updateDirect()`.

`session-manager.js` también tiene flujo propio de resolución de personajes para sesiones, pero no se observó una sobrescritura directa de las APIs globales de creación/actualización desde ese módulo.

Clasificación: 🟡 porque el guard modifica el flujo de creación/edición y depende del orden de carga.

Recomendación: mantener estable hasta contar con pruebas específicas de nombres, edición y fusión.

### 4. APIs públicas de duplicados/fusión — 🟡 CONTROLADAS

`duplicate-manager.js` expone `characterDuplicateDiagnostics`, `compareCharacters`, `openCharacterMerge`, `mergeCharacters` y `setMergeSource`.

No se observó una sobrescritura posterior de estas APIs en los archivos revisados.

Clasificación: 🟡 por impacto sobre la integridad de personajes, relaciones y sesiones.

## Dependencias globales sin sobrescritura

`session-manager.js` usa un adaptador interno `api` que delega en globals existentes (`active`, `save`, `uid`, `modal`, `close`, `toast`, `esc`, `inferRel`, `relationshipExists`, `relationshipLabelNormalize`, `normalizeCharacterText`, `renderSessions`). Esto reduce llamadas directas y preserva compatibilidad.

`relationship-guard.js` expone `relationshipExists` y `relationshipLabelNormalize` como APIs globales. Su función es una fuente de verdad para detección de relaciones duplicadas y se consume desde sesiones y otros flujos.

`map-labels.js` consume `active`, `esc` y otros helpers globales, además de envolver `renderMap`.

`backup.js` consume globals de UI y `state/migrate` durante restauración; no se recomienda refactorizar este flujo todavía.

## Clasificación global

| Elemento | Tipo | Riesgo | Acción |
|---|---|---:|---|
| `state` | estado global | 🔴 | congelar |
| `save()` | persistencia | 🔴 | congelar |
| `active()` | estado/libro activo | 🔴 | congelar |
| `migrate()` | migración | 🔴 | congelar |
| `renderMap()` wrapper | wrapper intencional | 🟠 | no tocar |
| `editCharacter()` wrapper | wrapper intencional | 🟡/🟠 | estudiar después |
| `createCharacter()` guard | wrapper/flujo controlado | 🟡 | mantener |
| `updateCharacter()` guard | wrapper/flujo controlado | 🟡 | mantener |
| APIs de fusión | API global | 🟡 | mantener |
| `relationshipExists()` | API global compartida | 🟡 | mantener |
| `relationshipLabelNormalize()` | API global compartida | 🟡 | mantener |

## Hallazgo arquitectónico principal

El problema no consiste simplemente en que existan globals. El patrón de mayor interés es el **wrapper posterior dependiente del orden de carga**:

`app.js → define API → módulo posterior captura original → módulo posterior reemplaza global → wrapper llama original + comportamiento adicional`.

Los dos casos confirmados más claros son `renderMap()` y `editCharacter()`.

## Candidata principal para futura intervención

### 🥇 `editCharacter()` — prioridad futura, no inmediata

Es conceptualmente más manejable que `renderMap()` porque el wrapper está delimitado a la edición de personajes y conserva `originalEdit`.

Una futura solución podría introducir una API explícita de extensión del editor de personajes, evitando reemplazar `window.editCharacter`.

Sin embargo, debe hacerse solo después de diseñar una frontera clara y probar:

- creación de personajes;
- edición;
- advertencias de nombres similares;
- eliminación;
- fusión;
- llamadas desde HTML;
- restauración/fallback.

## Candidata descartada como primera intervención

### `renderMap()`

No debe tocarse ahora. El wrapper interviene después del renderizado, depende de `setTimeout`, `MutationObserver`, SVG y del estado actual del mapa. Es una zona de alto riesgo.

## Reglas de congelación

No modificar en esta etapa:

- `state`;
- `save()`;
- `active()`;
- `migrate()`;
- modelo de datos;
- relaciones centrales;
- mapa;
- fusión;
- personajes reales.

## Conclusión

FASE 4D queda como auditoría arquitectónica, sin refactorización funcional.

La siguiente intervención, si se decide continuar, debe ser una **FASE 4E específica para diseñar una API explícita de extensión de `editCharacter()`**, pero únicamente después de revisar con detalle todos sus consumidores y su dependencia de HTML.
