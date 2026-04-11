# Hedgehog Maze 🦔

Un puzzle-maze game donde un erizo debe llegar a la salida mientras símbolos en el mapa mutan las reglas de movimiento.

## Mecánicas

- **Movimiento discreto** con flechas del teclado (celda a celda)
- **Símbolos de mutación** que cambian las reglas al pisarlos:
  - 🟣 **Swap dirección** — izquierda ↔ derecha
  - 🔵 **Congelar** — inmóvil por 2.5 segundos
  - 🟠 **Velocidad x2** — cooldown reducido por 5 segundos
  - 🔴 **Invertir todo** — todos los controles invertidos
- **Obstáculos progresivos**: muros, piedras, puentes/teletransportes
- **5 niveles** con dificultad incremental
- **Timer** por nivel como métrica de performance

## Niveles

| Nivel | Grilla | Obstáculos | Símbolo nuevo |
|-------|--------|------------|---------------|
| 1 - El despertar | 12×12 | Muros | Swap dirección |
| 2 - Piedra fría | 14×14 | + Piedras | Congelar |
| 3 - Portal express | 14×14 | + Teletransportes | Velocidad x2 |
| 4 - Mundo invertido | 16×16 | Todos | Invertir controles |
| 5 - La madriguera | 16×16 | Todos | Símbolos ocultos |

## Setup

```bash
npm install
npm run dev
```

## Stack

- React 18
- TypeScript
- Vite

## Licencia

MIT
