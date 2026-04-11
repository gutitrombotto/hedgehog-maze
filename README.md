# Hedgehog Maze

Un puzzle-maze game web donde un erizo se mueve por una grilla buscando la salida, mientras simbolos en el mapa mutan las reglas de movimiento en tiempo real.

**Jugar ahora:** https://hedgehog-maze.vercel.app

## Como jugar

- Usa las **flechas del teclado** para mover al erizo celda a celda
- Llega del punto de inicio hasta la **salida** (S)
- Los simbolos en el camino **mutan las reglas** de movimiento al pisarlos
- No hay condicion de derrota: se mide **tiempo** y **movimientos**

## Mecanicas

### Simbolos de mutacion

| Simbolo | Efecto | Tipo |
|---------|--------|------|
| Swap direccion | Izquierda y derecha se intercambian | Toggle |
| Congelar | Inmovil por 2.5 segundos | Temporal |
| Velocidad x2 | Cooldown de movimiento reducido por 5 segundos | Temporal |
| Invertir todo | Todos los controles invertidos | Toggle |

- Los **toggles** se revierten al pisar otro simbolo del mismo tipo
- Los **temporales** se desactivan automaticamente tras su duracion
- Multiples mutaciones pueden estar activas simultaneamente

### Obstaculos

- **Muros** — bloquean el movimiento
- **Piedras** — bloquean el movimiento (visual distinto)
- **Teletransportes** — transportan al par opuesto
- **Simbolos ocultos** — se revelan cuando el erizo esta a 2 casillas o menos

## Niveles

| Nivel | Nombre | Grilla | Novedades |
|-------|--------|--------|-----------|
| 1 | El despertar | 12x12 | Muros, Swap direccion |
| 2 | Piedra fria | 14x14 | + Piedras, Congelar |
| 3 | Portal express | 14x14 | + Teletransportes, Velocidad x2 |
| 4 | Mundo invertido | 16x16 | + Invertir controles |
| 5 | La madriguera | 16x16 | + Simbolos ocultos |

Cada nivel acumula los obstaculos y simbolos de los anteriores.

## Stack

- React 18 + TypeScript
- Vite 6
- Sin librerias externas de estado ni UI
- CSS keyframes para animaciones
- Desktop only (teclado)

## Setup local

```bash
npm install
npm run dev      # Dev server con HMR en http://localhost:5173
npm run build    # Build de produccion (tsc + vite)
npm run preview  # Preview del build
```

## Deploy

Desplegado en **Vercel**. Para redesplegar:

```bash
vercel --prod
```

## Licencia

MIT
