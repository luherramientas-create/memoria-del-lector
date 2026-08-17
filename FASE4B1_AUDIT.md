# FASE 4B.1 — Aislamiento de dependencias de session-manager.js

## Resultado

Se realizó la revisión de `session-manager.js` y se decidió **no modificar todavía el código funcional**. La razón es que el módulo depende de varias funciones globales de `app.js` y una sustitución parcial podría crear una segunda fuente de verdad o romper el orden de carga.

## Dependencias detectadas

| Dependencia | Origen | Uso en session-manager.js | Riesgo | Acción |
|---|---|---|---|---|
| `active()` | `app.js` | obtener el libro activo | Medio | Mantener temporalmente; candidato a API interna |
| `save()` | `app.js` | persistir cambios | Medio | Mantener única implementación |
| `uid()` | `app.js` | IDs de sesiones, personajes y relaciones | Bajo | Candidato a API interna |
| `modal()` | `app.js` | abrir formulario | Bajo | Candidato a API interna |
| `close()` | `app.js` | cerrar modal | Bajo | Candidato a API interna |
| `toast()` | `app.js` | mensajes al usuario | Bajo | Candidato a API interna |
| `inferRel()` | `app.js` | inferir modo/categoría de relación | Medio | Mantener única implementación |
| `relTypes` | `app.js` | sugerencias de relaciones | Medio | Candidato a API interna |
| `relationshipExists()` | módulo de relaciones | evitar duplicados | Medio | Requiere definir API explícita |
| `relationshipLabelNormalize()` | módulo de relaciones | normalización de etiquetas | Medio | Requiere definir API explícita |
| `normalizeCharacterText()` | `app.js` / capa de personajes | resolver personajes existentes | Medio | Mantener única implementación |
| `renderSessions()` | sesión/app | refrescar interfaz | Medio | Mantener API pública actual |
| `requireBook()` | `app.js` | validar libro activo | Medio | Mantener temporalmente |

## Conclusión arquitectónica

`session-manager.js` ya funciona como la implementación principal de sesiones, pero todavía utiliza una API global implícita. La migración segura debe hacerse en pasos:

1. Definir una API interna explícita para las dependencias.
2. Sustituir gradualmente referencias directas por esa API.
3. Mantener wrappers globales para compatibilidad con HTML y otros módulos.
4. Solo después evaluar la eliminación de duplicaciones en `app.js`.

## Decisión de esta microfase

**NO se realizó una modificación funcional de `session-manager.js`.**

No se eliminó ninguna función global, no se movió lógica y no se cambió el modelo de datos.

Esto es intencional: introducir una capa parcial sin completar el aislamiento habría dejado dos mecanismos de acceso y podría aumentar, en lugar de reducir, la deuda arquitectónica.

## Próximo paso recomendado

**FASE 4B.2 — Crear una API interna de dependencias para sesiones**, con cambios mínimos y una prueba de regresión inmediata.

La API deberá reutilizar las implementaciones existentes; no deberá duplicar `save()`, `uid()`, `active()`, `inferRel()` ni la lógica de relaciones.

## Áreas protegidas

No se modificaron:

- personajes reales;
- Escobillas;
- relaciones;
- mapa;
- sesiones existentes;
- fusión de personajes;
- importación/exportación;
- estructura de `state`;
- `localStorage`.
