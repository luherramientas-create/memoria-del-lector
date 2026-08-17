# FASE 4C.4 — Auditoría de utilidad `esc`

## Objetivo

Evaluar la eliminación de la implementación local duplicada `esc2()` de `session-manager.js` y su sustitución por la utilidad global `esc()` ya existente en `app.js`.

## Hallazgo

`app.js` define una única utilidad global:

```js
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
```

`session-manager.js` contiene una implementación equivalente bajo el nombre `esc2()`.

La función se utiliza exclusivamente para escapar valores antes de interpolarlos en HTML generado por el gestor de sesiones. No contiene estado ni lógica de negocio.

## Evaluación de riesgo

**Riesgo funcional: bajo.**

La sustitución propuesta sería conceptualmente:

```js
const esc2=...implementación local...
```

por una referencia al adaptador interno:

```js
esc:(...args)=>esc(...args)
```

y el reemplazo de las llamadas `esc2(...)` por `api.esc(...)`.

Esto mantiene el principio arquitectónico utilizado en FASE 4C.1–4C.2: las dependencias externas se consumen mediante el adaptador interno de `session-manager.js`, sin duplicar lógica global.

## Verificación de dependencia

`index.html` carga `app.js` antes de `session-manager.js`, por lo que `esc` está disponible cuando se inicializa el gestor de sesiones.

No se identificó dependencia de `esc2` fuera de `session-manager.js`.

## Decisión

La refactorización es **aprobada conceptualmente**, pero este commit **no modifica todavía `session-manager.js`**. Se evita realizar una sustitución parcial sobre un archivo cuya representación actual está compactada en bloques extensos, hasta disponer de una operación de edición que permita reemplazar el contenido completo de forma verificable.

No se modifica comportamiento funcional en esta fase.

## Estado

**FASE 4C.4 — AUDITORÍA COMPLETADA; CAMBIO DE CÓDIGO PENDIENTE DE APLICACIÓN SEGURA.**

## Próximo paso

Aplicar exclusivamente esta micro-refactorización:

1. Añadir `esc` al adaptador `api` de `session-manager.js`.
2. Sustituir `esc2(...)` por `api.esc(...)`.
3. Eliminar la implementación local de `esc2`.
4. No modificar ninguna otra lógica.
5. Verificar creación, edición y renderizado de sesiones.
