# MIMESIS: DESCENSO

> El laboratorio se hundió. Baja por los sectores, saquea lo que quede y no dejes que te copie.

Dungeon crawler en **primera persona, por turnos y con permadeath** para el reto **build&play** de Open2 / Build & Pitch 2026.

Tres sectores procedurales, linterna, pistola, tarjetas maestras, cofres y un **Rey Hueso** que convierte cada golpe en una copia tuya. **32 KB, sin librerías, sin imágenes, sin audio y sin fuentes externas.** Todo se dibuja y suena con código.

---

## Jugar

```bash
npm install
npm run build
npm run serve
# abre http://localhost:8002
```

Para desarrollar sin minificar:

```
http://localhost:8002/src/dev.html
```

**Objetivo:** bajar por B1, B2 y B3. En B1 y B2 necesitas la **tarjeta maestra** para usar las escaleras. En B3 **El Rey Hueso** bloquea la salida: elimínalo y extráete.

---

## Controles

| Acción | Escritorio | Móvil |
|---|---|---|
| Avanzar / retroceder | `W` / `S` o `↑` / `↓` | botones ▲ / ▼ o swipe vertical |
| Girar 90° | `A` / `D` o `←` / `→` | botones ◀ / ▶ o swipe horizontal |
| Moverse de lado | `Q` / `E` | — |
| Disparar | clic, `Espacio` | botón **FUEGO** o tap |
| Recargar | `R` | botón **RECARGA** |
| Interactuar / abrir | `F` | botón **ACCIÓN** (contextual) |
| Usar objeto | `1` botiquín · `2` cargador · `3` placa | **USAR** (cuando no hay nada que abrir) usa botiquín o placa |
| Pausa | `P` o `Esc` | botón `II` |
| Silencio | `M` | botón `M` |

El juego es horizontal. Si abres el link en vertical verás el aviso para girar el teléfono.

---

## Cómo se juega

- **Todo es por turnos.** Cada paso, disparo, recarga o interacción consume un turno; después se mueven los enemigos. Girar es gratis.
- **La linterna apunta hacia delante.** Lo que queda fuera del cono se ve como silueta; los enemigos delatan sus ojos. Cada **7–11 turnos** un destello de emergencia revela la sala entera durante un instante.
- **La pistola dispara al centro de la mira.** Si hay una pared entre tú y el objetivo, el disparo se pierde. Recargar consume un cargador y un turno.
- **Minimapa táctico cian** de 136×136: revela la mazmorra al explorarla y marca a los enemigos que están en zonas ya descubiertas. Las escaleras y la tarjeta aparecen cuando las ves.
- **Las copias son frágiles.** Tienen 1 de vida: un disparo o un golpe las disuelve. El Rey Hueso invoca una al iniciar el combate y otra cada vez que te golpea; intentan nacer delante de ti para que las veas. Elimínalas antes de que te acorralen.
- **La barra de inventario** (arriba a la izquierda) muestra lo que tienes: botiquines, cargadores y placas. Al recoger algo, el mensaje confirma el total, por ejemplo `BOTIQUÍN +1 (×3)`.
- **Avisos centrales**: si la vida baja al 30% o menos, o quedan 2 balas o menos, aparece un aviso pulsante debajo de la mira. Si no quedan cargadores, avisa `¡SIN MUNICIÓN!`.
- **Barra del jefe**: en B3, el Rey Hueso muestra su vida en una barra roja arriba al centro.
- **La Sombra (solo Difícil)**: al matar al Rey Hueso aparece una copia gigante invulnerable que te persigue. Si te alcanza, te mata de un golpe. La salida queda abierta: corre y extráete.
- **Permadeath.** Si te quedan 0 vidas, se acabó: el resumen muestra sector, turnos, tiempo, bajas, precisión, puntaje y rango S/A/B/C.

### Reglas

| Regla | Detalle |
|---|---|
| **Sectores** | 3: B1 contención, B2 incubación, B3 El Rey Hueso |
| **Mazmorra** | 24×24, salas y pasillos procedurales, camino garantizado |
| **Turnos** | Mover, disparar, recargar, usar o interactuar consume turno; girar no |
| **Vida** | 10 / 8 / 6 según el protocolo; sin regeneración |
| **Pistola** | 5–8 balas por cargador; recarga de 1 turno; 2 de daño |
| **Melee** | Caminar contra un enemigo o prop lo golpea; 1 de daño |
| **Golpe recibido** | 1 de daño (2 el jefe y los monstruos); La Sombra mata de un golpe; como máximo un golpe por turno |
| **Copias** | El Rey Hueso invoca una al iniciar el combate y otra al golpearte; máximo 3; intentan nacer delante de ti; **1 disparo o 1 golpe las disuelve**; también mueren si matas al Rey Hueso |
| **Tarjeta** | Obligatoria en B1 y B2 para bajar |
| **Barra del jefe** | El Rey Hueso muestra su vida arriba al centro en B3 |
| **La Sombra** | Solo en Difícil, al matar al Rey Hueso; invulnerable, 2 casillas por turno, un golpe te mata |
| **Salida B3** | Bloqueada hasta eliminar al Rey Hueso |
| **Victoria** | Extraerte en B3 |
| **Derrota** | Quedarte sin vida |

### Protocolos

| Protocolo | Vida | Balas | Cargadores | Botiquines | Enemigos |
|---|---|---|---|---|---|
| **Fácil** | 10 | 8 | 3 | 2 | 72% |
| **Medio** | 8 | 6 | 2 | 1 | 100% |
| **Difícil** | 6 | 5 | 1 | 1 | 138% |

---

## Enemigos

| Enemigo | Vida | Comportamiento |
|---|---|---|
| **Murciélago** | 1 | Vuela, es rápido y frágil; avanza 2 casillas cuando está lejos |
| **Esqueleto** | 2 | Guerrero medieval cuerpo a cuerpo |
| **Araña** | 2 | Rápida; avanza 2 casillas cuando está lejos |
| **Monstruo** | 4 | Araña gigante lenta; golpea por 2 y se mueve en turnos alternos |
| **Copia** | 1 | Persigue directo; aparece al iniciar el combate o cuando El Rey Hueso te golpea; intenta nacer delante de ti; un disparo o un golpe la disuelve |
| **Rey Hueso** | 12–14 | Jefe de B3; invoca una copia al iniciar, golpea, lanza magia y crea más copias |
| **La Sombra** | ∞ | Solo en Difícil; invulnerable, persigue y mata de un golpe |

## Objetos

| Objeto | Efecto |
|---|---|
| **Botiquín** | +4 vida |
| **Cargador** | Llena el cargador |
| **Placa** | +2 vida máxima y +2 vida |
| **Tarjeta maestra** | Abre las escaleras de B1 y B2 |

Los frascos y cajas se rompen y sueltan objetos; los cofres se abren con `F`. Los enemigos también pueden soltar loot.

---

## 32 KB y reglas del reto

| Regla | Cómo se cumple |
|---|---|
| **32 KB máximo, sin comprimir** | `index.html` + `game.min.js` = **31,946 bytes** (97,5% del límite). `npm run build` lo verifica y falla si se pasa. |
| **Solo código propio** | Canvas 2D, WebAudio y `localStorage`. Sin engines, frameworks ni dependencias en runtime. Terser solo se usa en build. |
| **Cero assets** | No hay imágenes, audio, fuentes ni base64. Texturas, sprites y sonido se generan en código. |
| **Repo nuevo y link jugable** | [eberthgarciavaldez01001.github.io/mimesis](https://eberthgarciavaldez01001.github.io/mimesis/) |
| **Originalidad** | Género de dungeon crawler en primera persona, pero jefe, personaje, escenario, arte y mecánicas propias. No usa nombres, personajes ni assets de Gloomgrave. |
| **Un juego por cuenta** | Primer envío de la cuenta de Open2. |

---

## Estructura

```
.
├── index.html        # entrada del juego (versión final)
├── game.min.js       # build minificado que descarga el navegador
├── build.mjs         # minifica + audita bytes
├── package.json
├── src/
│   ├── game.js       # fuente legible
│   └── dev.html      # harness de desarrollo
└── README.md
```

---

## Cómo está hecho

- **Raycaster propio (DDA)** a 320×180, escalado nearest-neighbor a 960×540. El HUD y los menús se dibujan nítidos a 960×540.
- **Texturas procedurales** de 16×16 para paredes, suelo y techo, con 8 niveles de iluminación precalculados. La luz combina cono de linterna, distancia, parpadeo y destellos.
- **Sprites procedurales** para enemigos, props, objetos, escalera y pistola, dibujados como billboards con z-buffer para que las paredes los tapen. Variantes de oscuridad y ojos brillantes para las siluetas.
- **Mazmorra procedural** de 24×24: salas sin solaparse, pasillos en L, conexiones extra para crear bucles, texturas de pared por sector y colocación garantizada de inicio, tarjeta, salida, props, loot y enemigos.
- **Turnos** con animación suave de movimiento y giro. La IA persigue en línea recta, rodea obstáculos y ataca al quedar adyacente. Los esqueletos atacan cuerpo a cuerpo.
- **Copias** que nacen delante del jugador al iniciar el combate y cuando El Rey Hueso acierta; persiguen al 100% de la velocidad y se disuelven de un disparo o un golpe; también desaparecen al matar al jefe.
- **Audio sintetizado** con osciladores y ruido: música táctica de 8 bits (bajo y arpegio) y efectos de disparo, recarga, impacto, daño, copia, victoria y derrota.
- **Persistencia** de protocolo y silencio con `localStorage`.

---

## Link público

**Jugalo en:** [https://eberthgarciavaldez01001.github.io/mimesis/](https://eberthgarciavaldez01001.github.io/mimesis/)

El repo es público y GitHub Pages sirve la rama `main` desde la raíz. `game.min.js` está commiteado. Si cambias `src/game.js`, corre `npm run build`, commitea el nuevo `game.min.js` y pushea.

---


## Créditos

Hecho para el reto **build&play** de Open2 (Build & Pitch · UVG · 21 nov 2026).

Inspirado en el género de dungeon crawlers en primera persona y roguelikes clásicos. Sin personajes, nombres, arte ni assets de otros juegos.
