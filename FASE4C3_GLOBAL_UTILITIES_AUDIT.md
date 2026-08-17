# FASE 4C.3 — Auditoría de utilidades globales

## Estado

**Auditoría completada. No se modificó código funcional.**

## Alcance y evidencia

Se revisaron directamente `app.js`, `session-manager.js`, `character-name-guard.js`, `duplicate-manager.js`, `delete-manager.js`, `relationship-guard.js`, `backup.js`, `map-labels.js` e `index.html`, además de la estructura actual del repositorio. La búsqueda automática de símbolos de GitHub no devolvió resultados fiables para consultas de funciones, por lo que **no se afirma un conteo exhaustivo de consumidores en todos los archivos**. Las conclusiones de abajo se limitan a usos comprobables en los archivos inspeccionados.

## 1. Utilidades globales identificadas

### `app.js`

`app.js` define como funciones de alcance global:

- `save()` — persistencia de `state` en `localStorage`.
- `uid()` — generación de identificadores.
- `active()` — acceso al libro activo.
- `esc()` — escape HTML.
- `modal()` — escritura/visualización del modal.
- `close()` — cierre del modal.
- `toast()` — notificación temporal.
- `normalizeCharacterText()` — normalización de nombres de personajes.

Estas funciones aparecen al inicio de `app.js`, junto con `state` y la clave de `localStorage`. `save()`, `uid()` y `active()` están estrechamente ligadas al núcleo de la aplicación y no son candidatas inmediatas de bajo riesgo.

## 2. Clasificación

| Función | Tipo | Pura | State | DOM | localStorage | Riesgo | Candidata inmediata |
|---|---|---:|---:|---:|---:|---|---|
| `save()` | persistencia | No | Sí | No | Sí | 🔴 | No |
| `uid()` | utilidad | Sí* | No | No | No | 🟠 | No inmediata |
| `active()` | acceso a estado | No | Sí | No | No | 🔴 | No |
| `esc()` | utilidad pura | Sí | No | No | No | 🟢 | **Sí** |
| `modal()` | UI | No | No | Sí | No | 🟡 | No inmediata |
| `close()` | UI | No | No | Sí | No | 🟡 | No inmediata |
| `toast()` | UI | No | No | Sí | No | 🟡 | No inmediata |
| `normalizeCharacterText()` | normalización de dominio | Sí | No | No | No | 🟡 | No inmediata |

\* `uid()` no tiene efectos persistentes, pero su resultado depende de tiempo y aleatoriedad; por eso se considera funcionalmente puro para este análisis solo respecto a efectos externos, no como función determinista.

## 3. Duplicaciones observadas

### Escape HTML

`session-manager.js` tiene un helper local `esc2()` que implementa esencialmente el mismo escape HTML que `app.js` hace mediante `esc()`.

`backup.js` también define `escB()` y `delete-manager.js` define `escD()`, ambos con la misma familia de reglas de escape.

Esto constituye la señal arquitectónica más clara de duplicación entre utilidades.

### Normalización de texto

Existen implementaciones equivalentes o muy similares de normalización en varios módulos:

- `normalizeCharacterText()` en `app.js`;
- `norm()` en `character-name-guard.js`;
- `normalize()` en `duplicate-manager.js`;
- `norm()` en `relationship-guard.js`.

No se deben unificar automáticamente: aunque comparten la misma operación básica, pertenecen a contextos de dominio diferentes y podrían divergir intencionalmente en el futuro.

## 4. Utilidades de UI

`modal()`, `close()` y `toast()` son globales y tienen consumidores entre módulos. No son funciones puras porque modifican el DOM y, en el caso de `toast()`, gestionan un temporizador global.

Se recomienda mantenerlas como API global de compatibilidad durante esta etapa.

## 5. Dependencia del orden de carga

`index.html` carga `app.js` primero y después los módulos especializados, terminando con `session-manager.js`. Esto permite que los módulos posteriores utilicen las utilidades globales de `app.js`.

Por tanto, encapsular una utilidad global sin respetar este orden podría generar regresiones. No se recomienda alterar el orden de carga en esta fase.

## 6. Candidatas

### 🥇 Candidata principal: `esc()`

Razones:

- función pequeña;
- comportamiento puro;
- sin acceso a `state`;
- sin acceso a `localStorage`;
- sin modificación del DOM;
- existe duplicación clara (`esc2`, `escB`, `escD`);
- el primer paso puede limitarse a `session-manager.js`;
- ya existe una API interna en `session-manager.js`, por lo que puede añadirse `api.esc()` y sustituirse `esc2` sin cambiar la API pública.

Riesgo estimado: 🟢 bajo, siempre que se verifique que las reglas de escape son idénticas.

### 🥈 Alternativa: `uid()`

Es pequeña y no modifica estado directamente, pero es utilizada por operaciones de creación/fusión/sesiones. Un error afectaría identificadores, por lo que el riesgo es mayor que con `esc()`.

Riesgo: 🟠.

### 🥉 Alternativa: normalización

Hay varias implementaciones casi equivalentes. Sin embargo, es lógica de dominio utilizada para detectar personajes y relaciones. Unificarla prematuramente podría alterar coincidencias existentes.

Riesgo: 🟡/🟠.

## 7. Funciones excluidas expresamente

No se recomiendan para la siguiente micro-refactorización:

- `state`;
- `save()`;
- `active()`;
- `migrate()`;
- `modal()`;
- `close()`;
- `toast()`;
- normalizadores de dominio;
- lógica central de relaciones;
- mapa;
- fusión de personajes.

## 8. Recomendación para 4C.4

La siguiente micro-refactorización recomendada es:

**4C.4 — Sustituir `esc2()` de `session-manager.js` por la utilidad global `esc()` mediante el adaptador interno `api.esc()`.**

Debe hacerse exclusivamente en `session-manager.js`.

No se recomienda todavía eliminar `escB()` o `escD()` de otros módulos porque eso aumentaría el alcance de la modificación.

## 9. Pruebas requeridas para 4C.4

Después del cambio comprobar como mínimo:

1. creación de sesión;
2. edición de sesión;
3. nombres con caracteres `&`, `<`, `>`, comillas y apóstrofes;
4. relaciones con caracteres especiales;
5. personajes con caracteres especiales;
6. mapa y tooltip;
7. modal;
8. consola sin errores.

## 10. Conclusión

La auditoría sí encontró una candidata clara y de bajo riesgo: **`esc()`**. No se recomienda tocar todavía las funciones críticas del núcleo.

**FASE 4C.3 — AUDITORÍA COMPLETADA.**

No se modificó ningún archivo JavaScript ni ningún dato de la aplicación.