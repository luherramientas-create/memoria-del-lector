# FASE 4B.3 — Diseño de la frontera de dependencias

## Estado

**Auditoría y diseño únicamente. No se modificó código funcional.**

## 1. Resumen ejecutivo

La aplicación funciona actualmente mediante un núcleo global en `app.js` y módulos especializados que se cargan posteriormente y, en algunos casos, sustituyen funciones globales. Esta arquitectura es funcional, pero presenta acoplamiento por globals y por orden de carga.

La estrategia recomendada es una refactorización incremental: conservar temporalmente las APIs globales necesarias para compatibilidad, definir fronteras de responsabilidad y migrar primero dependencias de bajo riesgo.

## 2. Responsabilidades propuestas

| Área | Responsabilidad principal propuesta |
|---|---|
| Estado y ciclo principal | `app.js` |
| Persistencia `save()` / estado activo | `app.js` temporalmente |
| Migración | `app.js` / módulo de migración futuro |
| Personajes | `app.js` + módulos de personajes/duplicados durante transición |
| Relaciones | funciones especializadas existentes; futura API de relaciones |
| Sesiones | `session-manager.js` |
| Mapa | `map-labels.js` y funciones de mapa |
| Fusión | `duplicate-manager.js` |
| Detección de nombres similares | `character-name-guard.js` / duplicados |
| Backup | `backup.js` |
| UI transversal | `modal()`, `close()`, `toast()` mientras se mantenga compatibilidad |

## 3. Frontera recomendada para sesiones

`session-manager.js` debe ser propietario de la lógica específica de sesiones: creación, edición, drafts, resolución de personajes de sesión y asociación de relaciones.

Debe consumir servicios externos para estado activo, persistencia, IDs, relaciones y UI, en vez de implementar esas responsabilidades.

Dependencias actuales relevantes: `active()`, `save()`, `uid()`, `modal()`, `close()`, `toast()`, `inferRel()`, `relationshipLabelNormalize()`, `relationshipExists()`, `normalizeCharacterText()`, `relTypes` y `renderSessions()`.

## 4. API global temporal

Mantener temporalmente como APIs de compatibilidad las funciones que HTML u otros módulos puedan invocar directamente, especialmente:

- `newSession`
- `editSession`
- `createSession`
- `updateSession`
- `renderSessions`

No eliminarlas durante las primeras refactorizaciones.

## 5. Sobrescrituras y orden de carga

La aplicación contiene funciones globales que son reemplazadas por módulos posteriores. Esto debe migrarse progresivamente hacia APIs explícitas, pero no se recomienda eliminar las sobrescrituras sin identificar todos sus consumidores.

Prioridad arquitectónica: reducir sobrescrituras y dependencias de orden de carga antes que eliminar globals por cantidad.

## 6. Regla de dependencia objetivo

Un módulo debe:

- consumir una API pública de otro módulo;
- solicitar operaciones mediante funciones explícitas;
- evitar modificar directamente la implementación interna de otro módulo;
- evitar sobrescribir funciones de otro módulo;
- evitar depender del orden de carga cuando exista una alternativa segura.

## 7. Áreas prioritarias

### 🟢 Bajo riesgo

- documentar y encapsular dependencias pequeñas;
- conservar wrappers de compatibilidad;
- reducir llamadas globales dispersas dentro de módulos especializados.

### 🟡 Riesgo medio

- centralizar APIs de relaciones;
- separar renderizado de lógica de sesiones;
- reducir dependencias directas entre sesiones y relaciones.

### 🟠 Riesgo alto

- cambiar `state`;
- modificar `save()`;
- cambiar `migrate()`;
- eliminar funciones globales utilizadas por HTML;
- modificar la lógica de fusión;
- cambiar el modelo de relaciones.

### 🔴 No tocar todavía

- estructura de datos;
- `localStorage`;
- migraciones existentes;
- lógica aprobada de fusión;
- comportamiento del mapa;
- datos reales de personajes.

## 8. Orden recomendado de futuras refactorizaciones

1. Definir una API interna estable para dependencias de `session-manager.js`.
2. Reducir llamadas globales directas en `session-manager.js` sin eliminar globals.
3. Diseñar una API explícita de relaciones.
4. Reducir sobrescrituras de renderizado y funciones globales.
5. Aislar progresivamente persistencia/estado.
6. Revisar `app.js` solo después de estabilizar las fronteras anteriores.

## 9. Criterio de rollback

Cada refactorización debe ser pequeña, reversible y acompañada de pruebas de regresión. Si una modificación cambia el comportamiento de sesiones, relaciones, mapa, fusión o persistencia, debe revertirse antes de continuar.

## 10. Conclusión

La arquitectura objetivo no requiere una reescritura ni una conversión inmediata a ES Modules. El enfoque recomendado es una transición gradual desde globals y sobrescrituras hacia APIs explícitas, manteniendo compatibilidad durante todo el proceso.

**No se modificó ningún archivo JavaScript como parte de esta fase.**
