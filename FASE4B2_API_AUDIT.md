# FASE 4B.2 — API interna controlada para `session-manager.js`

## Resultado

**No se aplicó una refactorización funcional en esta microfase.**

La revisión del estado actual de `session-manager.js` confirma que el módulo ya encapsula parte de sus dependencias mediante helpers locales (`book`, `catalogInfo`, `normalizeLabel`, etc.), pero todavía llama directamente a varias APIs globales. Crear una segunda capa parcial sin migrar de forma sistemática esas dependencias produciría una abstracción híbrida y aumentaría la complejidad.

## Dependencias observadas

- `active()` mediante `book()`.
- `inferRel()` mediante `catalogInfo()`.
- `relationshipLabelNormalize()` mediante `normalizeLabel()`.
- `relationshipExists()` mediante `findRelationshipForSession()`.
- `modal()` desde `openSessionForm()`.
- `toast()` desde varias operaciones.
- `close()` desde `closeSessionEditor()`.
- `uid()` en creación de personajes, relaciones y sesiones.
- `save()` al persistir sesiones.
- `renderSessions()` después de guardar.
- `relTypes` en las sugerencias de relaciones.
- `normalizeCharacterText()` durante la resolución de personajes.

## Decisión arquitectónica

No se introdujo una API `api.*` parcial en esta fase porque varias dependencias ya están parcialmente encapsuladas y otras siguen formando parte de la API global utilizada por el HTML y otros módulos.

El siguiente paso seguro debe ser diseñar una frontera de dependencias completa para `session-manager.js`, antes de reemplazar llamadas individuales.

## Integridad

- No se modificó `app.js`.
- No se modificó `session-manager.js`.
- No se modificó el modelo de datos.
- No se modificaron sesiones.
- No se modificaron personajes.
- No se modificaron relaciones.
- No se modificó la fusión.
- No se modificó el mapa.
- No se tocó Escobillas.

## Estado

**FASE 4B.2 — Auditoría completada; refactorización funcional aplazada por seguridad.**

La estabilidad de la aplicación prevalece sobre la reducción artificial del número de llamadas globales.
