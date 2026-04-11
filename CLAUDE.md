# CLAUDE.md

## Proyecto

Hedgehog Maze — un puzzle-maze game web donde un erizo se mueve por una grilla buscando la salida, mientras símbolos en el mapa mutan las reglas de movimiento en tiempo real.

## Stack

- Phaser 3 (v3.90) + TypeScript
- Vite 6
- Canvas/WebGL rendering (Phaser AUTO mode)
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
  main.ts              # Entry point: new Phaser.Game(config)
  config.ts            # Phaser.Game config (1100x750, AUTO, Scale.FIT, scenes)
  vite-env.d.ts        # Types de Vite
  data/
    types.ts           # Position, FlashMessage, ActiveMod, LevelDef, Direction
    constants.ts       # Cell types, cooldowns, COLORS (hex numbers), CSS_COLORS, SCENE_KEYS, FONT_FAMILY, LAYOUT (side-panel dimensions)
    levels.ts          # LEVELS array (data only, 5 niveles)
  utils/
    engine.ts          # Helpers puros: findCell, isBlocking, isSymbol, resolveHiddenType, formatTime, isNearPlayer
  scenes/
    BootScene.ts       # Genera texturas programáticamente (hedgehog, symbols, stone, exit, exit ring, start dot, particle, spark)
    GameScene.ts       # Gameplay: grid, player, movement, input polling, symbols, teleports, level lifecycle, particle effects, glow FX
    UIScene.ts         # HUD side-panel: title, level selector, stats, mods, flash messages, level complete overlay, legend
  objects/
    Player.ts          # Hedgehog sprite: moveTo() con tween + squash/stretch, speed x2 particle trail
  systems/
    GridManager.ts     # Builds grid from LevelDef, renders floor + overlays with visual effects (bevels, shadows, vignette, glow), markVisited, removeSymbol, hidden visibility
    ModifierSystem.ts  # swap/freeze/speed/invert state, timers via time.delayedCall(), getActiveMods()
public/
  hedgehog.svg         # Favicon
```

### Patrón de arquitectura

- **3 Phaser Scenes**: BootScene → GameScene + UIScene (launched in parallel)
- **GameScene** es el core: tiene GridManager, ModifierSystem, Player. Maneja input polling en `update()`, movement, symbols, teleports, level load/complete.
- **UIScene** es side-panel HUD (derecha): lee propiedades públicas de GameScene para updates de alta frecuencia (timer, moves). Escucha eventos para acciones discretas (levelLoaded, flash, levelComplete, modChanged).
- **Comunicación**: UIScene → GameScene via `gameScene.events.emit("ui:selectLevel")` etc. GameScene → UIScene via events (`flash`, `levelComplete`, `modChanged`).
- **`data/`** contiene tipos, constantes, datos de niveles — sin dependencia de Phaser.
- **`utils/engine.ts`** tiene funciones puras de lógica de juego.
- **`systems/`** encapsulan estado y lógica de subsistemas (grid, modifiers).
- **`objects/`** son game objects con comportamiento (Player sprite).

### Key Phaser patterns

- Input: `cursors = input.keyboard.createCursorKeys()` + manual cooldown check in `update()`
- Movement: `tweens.add({ targets: player, x, y, duration: 120 })`
- Camera shake: `cameras.main.shake(180, 0.003)` on symbol pickup
- Exit pulse: looping tween `yoyo: true, repeat: -1` + preFX glow pulse + rotating ring halo
- Particle burst: `add.particles()` emitter on symbol consumption (colored by symbol type)
- Speed trail: orange spark particles following player while speed x2 active
- Glow FX: `preFX.addGlow()` on exit (golden pulse) + brief flash on player at pickup
- Vignette: subtle edge darkening on board via gradient graphics
- Flash message: tween on y + alpha
- Hint blink: looping tween on alpha
- Timers: `time.delayedCall()` for freeze/speed, `time.addEvent({ delay: 10, loop: true })` for game timer
- Textures: all generated programmatically in BootScene via `add.renderTexture()` + `add.graphics()`

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
- Flash message animado al pisar un símbolo (tween fadeUp)
- Pills/badges mostrando mutaciones activas
- La salida pulsa con tween yoyo
- Texto parpadeante "Presioná una flecha para comenzar" (tween alpha blink)
- Camera shake al pisar símbolos
- Squash & stretch en el erizo al moverse
- Overlay de nivel completado con tiempo, movimientos y opciones de reintentar/siguiente

## Convenciones de código

- Idioma del código: inglés (nombres de variables, funciones, tipos, constantes)
- Idioma de UI: español (textos visibles al usuario, nombres de niveles, mensajes)
- Estado: propiedades de instancia en Scenes, no React hooks
- Los niveles se definen como arrays 2D de números en `data/levels.ts`
- Los tipos de celda son constantes numéricas exportadas desde `data/constants.ts` (no enums)
- Colores: `COLORS` object con hex numbers para Phaser, `CSS_COLORS` con strings para text styles
- Texturas generadas programáticamente en BootScene (no archivos de imagen)
- Funciones puras de lógica de juego van en `utils/engine.ts`

## Estética visual

- Tema oscuro: fondo #1a1714, texto #e8dcc8
- Tablero con estética de tierra/madera (muros #2a2522, camino #e8dcc8, piedras #8B7355)
- Font: JetBrains Mono (Google Fonts, loaded in index.html)
- Colores de símbolos: púrpura (swap), azul (freeze), naranja (speed), rojo (invert), verde (teleport)
- Animaciones via Phaser tweens
- Erizo estilo PostHog: generado con Graphics (ellipses, triangles, circles)

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
- Mobile: controles touch / swipe
- Más niveles
- Editor de niveles
- Particle effects on symbol pickup
- Screen transitions between levels
