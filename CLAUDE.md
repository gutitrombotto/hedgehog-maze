# CLAUDE.md

## Proyecto

Hedgehog Maze — un puzzle-maze game web donde un erizo se mueve por una grilla buscando la salida, mientras símbolos en el mapa mutan las reglas de movimiento en tiempo real.

## Stack

- React 18 + TypeScript
- Vite 6
- Sin librerías de estado externas (useState/useRef)
- Sin librerías de UI (estilos inline)
- Desktop only (teclado, sin touch/mobile)

## Comandos

```bash
npm run dev      # Dev server con HMR
npm run build    # tsc + vite build
npm run preview  # Preview del build de producción
```

TypeScript strict mode activado. El build falla si hay errores de tipos.

## Estructura

```
src/
  main.tsx              # Entry point, monta App en #root
  App.tsx               # Wrapper que renderiza HedgehogMaze
  HedgehogMaze.tsx      # Orquestador: conecta hooks con componentes (~120 líneas)
  index.css             # Estilos globales y keyframes
  vite-env.d.ts         # Types de Vite
  game/
    types.ts            # Tipos del juego (Position, FlashMessage, ActiveMod, LevelDef, SquashPhase)
    constants.ts        # Constantes de celdas, cooldowns, duraciones, HIDDEN_TYPES, SYMBOL_TYPES
    levels.ts           # LEVELS array (data only, 5 niveles)
    engine.ts           # Helpers puros: findCell, isBlocking, isSymbol, resolveHiddenType, formatTime, gridPixelPos, isNearPlayer
  components/
    Hedgehog.tsx        # SVG del erizo
    SymbolIcon.tsx      # SVG de íconos de símbolos (swap, freeze, speed, invert, teleport)
    Board.tsx           # Grilla + overlay del erizo + flash message + overlay nivel completado
    HUD.tsx             # Header, selector de nivel, stats, mods activos, hint de inicio
  hooks/
    useGameState.ts     # Todo el estado del juego + loadLevel + handleSymbol + showFlash + efectos (timer, visual sync)
    useKeyboard.ts      # handleKeyDown + listener de teclado
public/
  hedgehog.svg          # Favicon
```

### Patrón de arquitectura

- **`HedgehogMaze.tsx`** es un orquestador liviano: usa `useGameState` y `useKeyboard`, computa `activeMods`, renderiza `<HUD>` + `<Board>` + legend.
- **`useGameState`** centraliza los 19 state variables, 6 refs, y las acciones (`loadLevel`, `handleSymbol`, `showFlash`). Retorna todo lo necesario para los componentes y `useKeyboard`.
- **`useKeyboard`** recibe state/refs/actions como params, computa la nueva posición fuera del state updater, y llama `setPlayerPos` con un valor directo (no functional updater) para evitar side effects dentro de updaters.
- **`game/`** contiene tipos, constantes, datos de niveles y funciones puras sin dependencia de React.
- **`components/`** son componentes visuales que reciben props, sin lógica de estado propia.

### Regla importante: no side effects en state updaters

No llamar funciones con side effects (como `handleSymbol`, `setGrid`, `showFlash`) dentro de functional updaters de `setState`. React StrictMode en dev invoca los updaters dos veces, lo cual cancela toggles (`setSwapLR((v) => !v)` se ejecuta 2 veces = neto cero). Computar la nueva posición con el valor del state capturado en closure y llamar `setPlayerPos(newValue)` directamente.

## Game Design Doc

### Core loop
El erizo se mueve celda a celda con flechas del teclado por una grilla. Debe llegar del punto de inicio (START) a la salida (EXIT). No hay condición de derrota — solo se mide tiempo y movimientos.

### Movimiento
- Discreto (celda a celda), NO continuo
- Cooldown de 150ms entre movimientos (75ms con speed x2)
- Las flechas del teclado son el único input

### Tipos de celda (constantes numéricas en el código)
| Código | Tipo | Comportamiento |
|--------|------|----------------|
| 0 | EMPTY | Transitable |
| 1 | WALL | Bloquea movimiento |
| 2 | STONE | Bloquea movimiento (visual distinto a muro) |
| 3 / 33 | TELEPORT_A / TELEPORT_B | Teletransporta al par opuesto |
| 4 | SWAP_DIR | Muta regla: izquierda ↔ derecha (toggle) |
| 5 | FREEZE | Muta regla: inmóvil 2.5 segundos |
| 6 | SPEED_X2 | Muta regla: cooldown reducido por 5 segundos |
| 7 | INVERT_ALL | Muta regla: todos los controles invertidos (toggle) |
| 8 | START | Posición inicial del erizo |
| 9 | EXIT | Salida del nivel |
| 14-17 | HIDDEN_* | Versiones ocultas de los símbolos (se revelan a ≤2 casillas) |

### Progresión de niveles
| Nivel | Grilla | Obstáculos nuevos | Símbolo nuevo |
|-------|--------|-------------------|---------------|
| 1 "El despertar" | 12×12 | Muros | Swap dirección |
| 2 "Piedra fría" | 14×14 | Piedras | Congelar |
| 3 "Portal express" | 14×14 | Teletransportes | Velocidad x2 |
| 4 "Mundo invertido" | 16×16 | (todos) | Invertir controles |
| 5 "La madriguera" | 16×16 | (todos) | Símbolos ocultos |

Cada nivel acumula los obstáculos y símbolos de los anteriores.

### Mecánica de mutación de reglas
- Los símbolos se consumen al pisarlos (desaparecen del grid)
- SWAP_DIR e INVERT_ALL son toggles (pisarlo de nuevo lo revierte)
- FREEZE y SPEED_X2 son temporales (duración fija, luego se desactivan)
- Los símbolos ocultos (nivel 5) solo se muestran cuando el erizo está a ≤2 casillas de distancia
- Múltiples mutaciones pueden estar activas simultáneamente

### Feedback visual
- Flash message animado al pisar un símbolo (texto + color del símbolo)
- Pills/badges mostrando mutaciones activas sobre el tablero
- La salida pulsa con animación
- Texto parpadeante "Presioná una flecha para comenzar"
- Overlay de nivel completado con tiempo, movimientos y opciones de reintentar/siguiente

## Convenciones de código

- Idioma del código: inglés (nombres de variables, funciones, tipos, constantes)
- Idioma de UI: español (textos visibles al usuario, nombres de niveles, mensajes)
- Estilos: inline styles, sin CSS modules ni styled-components
- Estado: hooks nativos de React, sin Redux/Zustand
- Los niveles se definen como arrays 2D de números en `game/levels.ts`
- Los tipos de celda son constantes numéricas exportadas desde `game/constants.ts` (no enums) por simplicidad de comparación en grids
- Componentes SVG inline para el erizo (`Hedgehog.tsx`) y los íconos de símbolos (`SymbolIcon.tsx`)
- Funciones puras de lógica de juego van en `game/engine.ts`

## Estética visual

- Tema oscuro: fondo #1a1714, texto #e8dcc8
- Tablero con estética de tierra/madera (muros #2a2522, camino #e8dcc8, piedras #8B7355)
- Font: JetBrains Mono / SF Mono / Fira Code (monospace)
- Colores de símbolos: púrpura (swap), azul (freeze), naranja (speed), rojo (invert), verde (teleport)
- Sin librerías de animación — CSS keyframes puras
- Erizo estilo PostHog: SVG simpático con púas triangulares, ojos redondos, nariz marrón

## Diseño de niveles

Al crear o modificar niveles:
- El grid debe estar completamente rodeado de WALL (borde exterior)
- Debe existir exactamente un START (8) y un EXIT (9)
- Los teletransportes van en pares (TELEPORT_A=3, TELEPORT_B=33)
- Debe existir al menos un camino posible del START al EXIT
- Los símbolos deben estar en celdas transitables (EMPTY)
- Los símbolos ocultos (14-17) solo en nivel 5
- Progresión: niveles más grandes y más símbolos = más difícil

## Deploy

- Hosting: Vercel
- URL de producción: https://hedgehog-maze.vercel.app
- Deploy automático con `vercel --prod`
- Vercel auto-detecta Vite (build command: `vite build`, output: `dist/`)

## Próximos pasos potenciales

- Sonido/SFX al pisar símbolos, completar nivel, moverse
- Leaderboard local (localStorage)
- Animación de movimiento del erizo (transición entre celdas)
- Mobile: controles touch / swipe
- Más niveles
- Editor de niveles
