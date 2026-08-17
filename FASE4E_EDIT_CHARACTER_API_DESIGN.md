# FASE 4E — Diseño de API explícita para extensiones de edición

## 1. Estado actual

La implementación actual define `editCharacter()` en `app.js`. `index.html` carga `app.js` antes de los módulos especializados. `delete-manager.js` captura la referencia original y posteriormente reemplaza `window.editCharacter`. `character-name-guard.js` define su propio `updateCharacter()` y `createCharacter()`.

`app.js` mantiene `editCharacter()` como API global utilizada directamente desde HTML (`onclick="editCharacter(...)"`). Por compatibilidad, esa API debe permanecer.

## 2. Problema arquitectónico

El problema no es simplemente que exista un wrapper: el código actual de `delete-manager.js` reemplaza prácticamente toda la interfaz de edición cuando el personaje existe. La referencia `originalEdit` solo se utiliza como fallback cuando el personaje no se encuentra. Por tanto, la solución futura no debe diseñarse como un simple hook `before/after` de la implementación actual: debe permitir que un módulo especializado añada acciones al editor sin reconstruir el editor completo.

## 3. Flujo actual

```text
HTML / usuario
    ↓
window.editCharacter(id)
    ↓
app.js: editor estándar
    ↓
<form onsubmit="updateCharacter(...)" ...>
    ↓
window.updateCharacter()
    ↓
save()
    ↓
renderCharacters()
```

Con `delete-manager.js` actualmente:

```text
HTML / usuario
    ↓
window.editCharacter(id)
    ↓
delete-manager.js reemplaza la función
    ↓
editor reconstruido por delete-manager
    ↓
updateCharacter()
```

El orden de carga actual es `app.js`, seguido por `map-labels.js`, `backup.js`, `duplicate-manager.js`, `character-name-guard.js`, `relationship-guard.js`, `delete-manager.js` y `session-manager.js`. fileciteturn281file0

## 4. Responsabilidades

### Núcleo (`app.js`)

Debe conservar:

- localizar el personaje;
- construir el formulario estándar de edición;
- cargar nombre completo;
- cargar nombre corto;
- cargar descripción;
- cargar primera aparición;
- permitir guardar/cancelar;
- mantener `window.editCharacter(id)`.

`app.js` también conserva `updateCharacter()` como comportamiento base actual. fileciteturn287file0

### `delete-manager.js`

Debe aportar únicamente la acción adicional:

- mostrar "Eliminar personaje" dentro del contexto de edición;
- ejecutar su flujo de confirmación/eliminación.

Actualmente también reconstruye todo el formulario de edición; eso es precisamente lo que se pretende evitar.

### `character-name-guard.js`

Su responsabilidad actual es advertir sobre nombres exactos o similares y controlar el flujo de creación/actualización. No hay evidencia suficiente para afirmar que necesite intervenir en la construcción visual de `editCharacter()`. Su punto de integración principal parece ser `updateCharacter()`, por lo que no debe recibir una extensión de editor innecesaria.

### `duplicate-manager.js`

Mantiene la lógica de comparación/fusión. No debe acoplarse al editor salvo que una futura necesidad concreta lo justifique.

## 5. Estrategias consideradas

### A. Registry de extensiones del editor — 🟢 RECOMENDADA

Concepto:

```js
registerCharacterEditorExtension({
  id: 'delete-character',
  renderActions({id, character}) { ... }
});
```

`editCharacter()` permanece en `app.js` y, al construir el editor, solicita a un registry las acciones adicionales registradas.

Ventajas:

- elimina la sobrescritura de `window.editCharacter`;
- mantiene una sola fuente de verdad para el formulario;
- permite múltiples extensiones;
- no exige que `app.js` conozca `delete-manager.js`;
- funciona con el orden actual de carga porque el registry se define antes y las extensiones se registran después;
- mantiene `editCharacter(id)` como API pública.

Riesgo: 🟢/🟡. Requiere modificar `app.js` y migrar `delete-manager.js`, pero el cambio puede hacerse en dos pasos y no afecta el modelo de datos.

### B. Hooks `before/after` — 🟡

Ejemplo:

```js
registerBeforeCharacterEdit(fn);
registerAfterCharacterEdit(fn);
```

Problema: no resuelve limpiamente el caso de `delete-manager.js`, que necesita añadir una acción visible dentro del formulario. Un hook `after` tendría que conocer detalles del DOM y seguiría dejando lógica de presentación fuera de una frontera clara.

### C. Registro de acciones solamente — 🟢/🟡

Ejemplo:

```js
registerCharacterEditAction(fn);
```

Es más simple que un registry completo, pero ofrece menos estructura para futuras extensiones. Puede ser suficiente si se demuestra que solo se necesitan botones/acciones.

### D. Mantener el wrapper actual — 🟡

Es la opción de menor riesgo inmediato porque ya funciona. Sin embargo, mantiene el acoplamiento y obliga a cada extensión futura a conocer/guardar la implementación anterior. No es una mejora arquitectónica.

## 6. Diseño recomendado

Usar un **registry mínimo de extensiones del editor**, sin convertirlo en un sistema general de plugins.

Conceptualmente:

```js
const characterEditorExtensions = [];

function registerCharacterEditorExtension(extension) {
  if (!extension?.id) return;
  if (characterEditorExtensions.some(x => x.id === extension.id)) return;
  characterEditorExtensions.push(extension);
}
```

La función `editCharacter(id)` seguiría siendo propiedad del núcleo y, al generar el formulario, incorporaría las acciones registradas.

Conceptualmente:

```js
const actions = characterEditorExtensions
  .map(ext => ext.renderActions?.({id, character:c}))
  .filter(Boolean)
  .join('');
```

`delete-manager.js` se registraría después de cargar `app.js`:

```js
registerCharacterEditorExtension({
  id: 'delete-character',
  renderActions({id}) {
    return `<button ... onclick="deleteCharacter('${id}')">🗑️ Eliminar personaje</button>`;
  }
});
```

El núcleo seguiría construyendo el formulario estándar y simplemente reservaría un área para acciones adicionales.

## 7. Reglas de la API propuesta

- `window.editCharacter` permanece pública.
- El registry se crea una sola vez en `app.js`.
- Las extensiones se registran después de `app.js`.
- Cada extensión tiene un `id` único.
- Un registro duplicado se ignora.
- Una extensión no disponible no impide abrir el editor.
- Una extensión no modifica directamente la implementación de `editCharacter()`.
- Las extensiones no modifican `state` solo por registrarse.
- El registry no debe convertirse en un event bus general.

## 8. Manejo de errores

La primera implementación debería aislar el render de cada extensión. Si una extensión falla al generar su HTML, debe registrarse el error en consola y el editor base debe seguir disponible.

No se deben ocultar errores de programación silenciosamente.

## 9. Compatibilidad

Se conserva:

```js
editCharacter(id)
```

porque HTML y otros módulos la utilizan.

No se requiere cambiar el modelo de datos.

No se requiere cambiar `save()`, `active()`, `state`, relaciones, sesiones, mapa ni fusión.

## 10. Migración propuesta

### Paso A — API

Añadir el registry y `registerCharacterEditorExtension()` en `app.js`, sin eliminar el wrapper actual.

### Paso B — Integración del núcleo

Modificar `editCharacter()` para reservar un área de acciones de extensiones.

### Paso C — Migrar `delete-manager.js`

Dejar de reemplazar `window.editCharacter` y registrar únicamente la acción de eliminación.

### Paso D — Pruebas

Comprobar edición normal y eliminación.

### Paso E — Retirar wrapper

Solo cuando las pruebas sean satisfactorias, eliminar:

```js
const originalEdit = window.editCharacter;
window.editCharacter = function(...) { ... };
```

### Paso F — No migrar `character-name-guard.js` automáticamente

Primero verificar si realmente necesita una extensión visual del editor. Su lógica actual está centrada en `createCharacter()`/`updateCharacter()`, por lo que probablemente no necesita el registry.

## 11. Riesgos

### 🟢 Bajo

- mantener `editCharacter()` pública;
- añadir un registry vacío;
- registrar una sola acción de eliminación;
- no modificar datos.

### 🟡 Moderado

- cambiar el HTML generado por `editCharacter()`;
- migrar `delete-manager.js`;
- interacción entre el botón de eliminar y el modal.

### 🟠 Alto

- cambiar simultáneamente `updateCharacter()`;
- migrar `character-name-guard.js` sin necesidad;
- cambiar el orden de carga;
- modificar `state` o persistencia.

### 🔴 No tocar

- `state`;
- `save()`;
- `active()`;
- `migrate()`;
- modelo de relaciones;
- fusión;
- mapa.

## 12. Rollback

La migración debe hacerse en commits pequeños. Si la nueva acción de eliminación falla:

1. revertir el commit de migración de `delete-manager.js`;
2. conservar el editor base anterior;
3. restaurar el wrapper actual si ya fue eliminado.

No se requiere modificar datos para rollback.

## 13. Pruebas necesarias

Antes de retirar el wrapper:

1. Abrir edición de personaje.
2. Verificar todos los campos.
3. Editar y guardar.
4. Cancelar.
5. Crear personaje.
6. Activar advertencia de nombre duplicado.
7. Ejecutar eliminación.
8. Cancelar eliminación.
9. Confirmar eliminación.
10. Restaurar backup de eliminación.
11. Abrir fusión desde duplicados.
12. Verificar mapa.
13. Verificar sesiones.
14. Revisar consola.

## 14. Condiciones para implementar

Implementar solo si:

- el registry puede mantenerse pequeño;
- `editCharacter()` sigue siendo la única fuente del formulario;
- `delete-manager.js` puede reducirse a su responsabilidad específica;
- no se modifica el modelo de datos;
- rollback es trivial.

## 15. Condiciones para NO implementar

No implementar si:

- requiere modificar varios módulos críticos simultáneamente;
- requiere cambiar `updateCharacter()` sin necesidad;
- exige cambiar el orden de carga;
- introduce un sistema de plugins genérico;
- no puede preservarse `editCharacter(id)`;
- las pruebas muestran regresiones.

## 16. Conclusión

La alternativa recomendada es un **registry mínimo de extensiones de edición**. Es mejor que los hooks genéricos porque el problema actual de `delete-manager.js` es visual/funcional: necesita añadir una acción al editor. También es más segura que mantener wrappers porque conserva una única implementación de `editCharacter()`.

La migración debe ser gradual. **No se debe implementar todavía como una refactorización masiva.** La primera implementación futura debe introducir el registry sin retirar el wrapper; después se migra únicamente `delete-manager.js`; finalmente se elimina el wrapper cuando la prueba funcional confirme equivalencia.

## 17. Estado de FASE 4E

**DISEÑO COMPLETADO — NO IMPLEMENTADO.**

No se modificó código funcional.
