# FASE 6.3 — Usabilidad y navegación del mapa neuronal

## Objetivo

Mejorar únicamente la usabilidad del mapa neuronal experimental a partir de la prueba con datos reales.

## Correcciones implementadas

### 1. Dirección semántica

Las relaciones dirigidas conservan `relationship.from → relationship.to` y ya no dependen del orden alfabético o del orden visual de los nodos.

- Dirigida: `Persona A → Persona B`
- Simétrica: `Persona A ↔ Persona B`
- Si existen direcciones opuestas entre el mismo par, la conexión visual puede mostrar flechas en ambos sentidos y el tooltip conserva cada relación individual.

### 2. Tooltip de personaje

El tooltip utiliza información real almacenada en el personaje:

- nombre completo;
- descripción, cuando existe;
- primera aparición, cuando existe.

No se genera ni inventa información.

### 3. Tooltip de relaciones

Cada relación mantiene sus extremos reales y su semántica. Las relaciones múltiples entre el mismo par continúan compartiendo una conexión visual, pero el tooltip muestra cada relación por separado.

### 4. Zoom

Se añadió:

- rueda del mouse para acercar/alejar;
- botón `−`;
- botón `+`;
- indicador porcentual;
- límites de zoom entre 35% y 250%.

El zoom transforma la vista, no modifica las posiciones persistentes ni los datos.

### 5. Pan

Arrastrar el espacio vacío permite desplazar la cámara del mapa.

Arrastrar un nodo continúa moviendo únicamente ese personaje.

### 6. Ajustar

El control `⛶ Ajustar` calcula el área ocupada por la red y ajusta escala y desplazamiento para mostrar todos los nodos.

### 7. Reorganizar

`↻ Reorganizar` continúa significando reorganizar la distribución de los nodos. Se mantiene separado de `Ajustar`, que solamente cambia la cámara.

## Alcance deliberadamente excluido

No se implementaron en esta fase:

- filtros por tipo de relación;
- profundidad de relaciones;
- comunidades;
- métricas de centralidad;
- búsqueda;
- colores semánticos;
- animaciones neuronales;
- partículas;
- adaptación móvil;
- refactorización general de la aplicación.

## Archivos modificados

- `neural-map-real.html`

## Archivo documental

- `FASE6.3_NEURAL_MAP_USABILITY.md`

## Integridad

El mapa tradicional no fue modificado.

No se modificaron personajes, relaciones, sesiones, fusiones ni datos persistentes.

## Commit

`c9593acbf508d7be102942d49dccaf0d53db3ffc`

## Próximo paso recomendado

Probar nuevamente el mapa neuronal con datos reales y evaluar si la navegación, el tooltip y la lectura de direcciones son suficientemente claros antes de añadir nuevas funciones visuales o de exploración.
