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
  main.tsx           # Entry point, monta App en #root
  App.tsx            # Wrapper que renderiza HedgehogMaze
  HedgehogMaze.tsx   # Componente principal del juego (toda la lógica)
  index.css          # Estilos globales y keyframes
  vite-env.d.ts      # Types de Vite
public/
  hedgehog.svg       # Favicon
```

Actualmente es un solo componente monolítico (`HedgehogMaze.tsx`). Si se refactoriza, respetar esta estructura sugerida:

```
src/
  components/        # Componentes visuales (Hedgehog, SymbolIcon, Board, etc.)
  game/
    types.ts         # Tipos del juego (Position, CellType, Level, etc.)
    levels.ts        # Definición de niveles (grillas)
    constants.ts     # Constantes (cooldowns, duraciones, cell types)
    engine.ts        # Lógica de movimiento, colisiones, efectos
  hooks/
    useGameState.ts  # Estado principal del juego
    useKeyboard.ts   # Manejo de input del teclado
    useTimer.ts      # Timer del nivel
```

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
- Los niveles se definen como arrays 2D de números en la constante LEVELS
- Los tipos de celda son constantes numéricas (no enums) por simplicidad de comparación en grids
- Componentes SVG inline para el erizo y los íconos de símbolos

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
