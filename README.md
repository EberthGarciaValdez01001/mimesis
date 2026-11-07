# MIMESIS

> El gusano te copia. Tienes 8 vidas y un machete.

Boss fight biolab para el reto **build&play** de Open2 / Build & Pitch 2026.

Un experimento se escapó en el laboratorio. Tiene **10 segmentos** y una cabeza blindada. Tú tienes un machete y **8 vidas en Medio** (10 en Fácil, 6 en Difícil). Cada vez que el gusano te toca o te acierta una baba, pierdes una vida y nace una **copia tuya** que te persigue. Cada corte que le das al gusano **disuelve una copia**.

**32 KB · pixel art · sin librerías · sin imágenes · sin audio · sin fuentes externas.**
Todo se dibuja y suena con código. El mundo se renderiza a 480×270 y se escala con nearest-neighbor; el HUD y los menús quedan nítidos para que se lean.

---

## Jugar

- **Modo:** elige **Fácil / Medio / Difícil** en el menú con clic/tap o `1` / `2` / `3`. Se guarda para la próxima.
- **Moverte:** `WASD` / flechas / joystick virtual.
- **Cortar:** `Espacio`, `J`, `K`, clic izquierdo o el botón **CORTE**.
- **Pausa:** `P` o `Esc` (en móvil se pausa al salir).
- **Silenciar:** `M` o el icono de la bocina.

El machete **apunta solo al segmento de cuerpo más cercano** dentro del alcance. Tú solo te posicionas y atacas.

La **cabeza está blindada** hasta que cortes los 9 segmentos del cuerpo. Después queda expuesta y son **2 golpes finales**.

El récord guarda el mejor **rango y tiempo de cada modo** en `localStorage`.

---

## Modos

| Modo | Vidas | Copias | Velocidad del gusano | Invulnerabilidad |
|---|---|---|---|---|
| **Fácil** | 10 | 78% · máx. 5 | 82% | 2.0 s |
| **Medio** | 8 | 89% · máx. 8 | 100% | 1.4 s |
| **Difícil** | 6 | 96% · máx. 10 | 115% | 1.0 s |

Además, Fácil tiene más alcance de machete y ataques más espaciados; Difícil tiene menos alcance, más baba y copias que casi igualan tu velocidad. Al morir o ganar vuelves al menú para elegir otro modo.

## Reglas

| Regla | Detalle |
|---|---|
| **Gusano** | 10 segmentos: 9 de cuerpo + 1 cabeza |
| **Golpes** | 2 por segmento = **20 golpes** |
| **Cabeza** | Blindada hasta cortar el cuerpo; luego 2 golpes |
| **Vidas** | 10 / 8 / 6 según el modo, sin curación |
| **Golpe del gusano** | Contacto o baba = **−1 vida + 1 copia** |
| **Copias** | Invulnerables, persecución directa al **78–96%** de tu velocidad, máximo **5 / 8 / 10** |
| **Corte** | Disuelve la copia más cercana a ti y acorta al gusano |
| **Victoria** | Cortar los 10 segmentos |
| **Derrota** | Quedarte sin vidas: “TE COPIARON” |

### El loop

> El gusano te toca → pierdes una vida y nace tu copia → cortas un segmento → se disuelve una copia → el gusano se acorta y se enfurece → repites.

Cortar es progreso **y** limpieza. Sin esa regla, el juego se volvería imposible muy rápido.

---

## Correr en local

```bash
npm install
npm run build
npm run serve
# abre http://localhost:8002
```

`npm run build` minifica `src/game.js` a `game.min.js` y audita el peso total. Falla si `index.html + game.min.js` supera los 32,768 bytes.

Para desarrollar sin minificar:

```
http://localhost:8002/src/dev.html
```

---

## Reglas del reto

| Regla | Cómo se cumple |
|---|---|
| **32 KB máximo, sin comprimir** | `index.html` (1.31 KB) + `game.min.js` (29.03 KB) = **31,070 bytes** (94.8% del límite). `npm run build` lo verifica. |
| **Solo código propio** | Canvas 2D, WebAudio y `localStorage`. Sin engines ni frameworks. Terser solo se usa en build; no se sirve. |
| **Cero assets** | No hay imágenes, audio, fuentes ni base64. Todo el arte es procedural y todo el sonido se sintetiza con osciladores y ruido. |
| **Repo nuevo y link jugable** | Este repo + GitHub Pages (ver abajo). |
| **Original** | Jefe, mecánica, personaje y escenario propios. Sin personajes ni assets de otros juegos. |
| **Un juego por cuenta** | Este es el único juego del repo. |

---

## Estructura

```
.
├── index.html        # entrada del juego (versión final)
├── game.min.js       # build minificado que descarga el navegador
├── build.mjs         # minifica + audita bytes
├── package.json
├── src/
│   ├── game.js       # fuente legible (no se descarga en producción)
│   └── dev.html      # harness de desarrollo
└── README.md
```

---

## Cómo está hecho

- **Canvas 2D** a 960×540 lógicos, escalado con `devicePixelRatio` y letterbox.
- **Render pixel-art:** el mundo se dibuja en un buffer de **480×270** y se amplía con nearest-neighbor; el HUD, los menús y los textos se dibujan nítidos a 960×540.
- **Sprites procedurales:** el agente (32×32), las copias y el gusano (cabeza 40×40, segmentos 28×28) se generan en canvas al iniciar y se dibujan en código. No hay PNGs ni assets en el juego.
- **Hojas de diseño:** están en `../mimesis-design/` (fuera del repo del juego) como documentación; no se cargan en el build de 32 KB.
- **Modos:** Fácil / Medio / Difícil cambian vidas, copias, velocidad del gusano, invulnerabilidad, alcance y cadencias. El mejor rango/tiempo se guarda por modo.
- **Gusano segmentado:** el cuerpo sigue a la cabeza con una restricción de distancia; cada segmento se puede cortar y la cadena se reconecta. La cabeza está blindada hasta que no queda cuerpo.
- **Machete autoapuntado:** elige el segmento de cuerpo más cercano dentro del alcance; prioriza los segmentos ya dañados para que no se dispersen los golpes.
- **Copias:** se crean alrededor del jugador al recibir un golpe; se forman durante 1.3 s, persiguen directo al 89% de la velocidad y son invulnerables. El jugador tiene 1.4 s de invulnerabilidad.
- **Baba:** proyectiles telegrafiados desde la boca; si aciertan, cuentan como golpe del gusano.
- **Fases:** el gusano acelera y ataca más seguido a medida que pierde segmentos; la cabeza expuesta es la fase final.
- **Audio sintetizado:** hum de laboratorio, machete, squelch, copias, baba, alarma y latido cuando quedan 3 vidas o menos.
- **Sin dependencias en runtime.**

---

## Deploy en GitHub Pages

1. Crea un repositorio **público** nuevo, por ejemplo `mimesis`.
2. Conecta y sube:

```bash
git remote add origin https://github.com/TU-USUARIO/mimesis.git
git push -u origin main
```

3. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
4. El juego queda en `https://TU-USUARIO.github.io/mimesis/`.

`game.min.js` ya está commiteado. Si cambias `src/game.js`, corre `npm run build` y commitea el nuevo `game.min.js`.

---

## Checklist antes de enviar

- [ ] Repo público creado **durante** el reto.
- [ ] GitHub Pages activo y link probado en escritorio y teléfono.
- [ ] `npm run build` termina sin error y muestra menos de 32,768 bytes.
- [ ] Probar mover, cortar, copias, baba, pausa, mute, victoria, derrota y reinicio en móvil.
- [ ] Enviar el link en Open2 antes del **13 nov 2026, 23:59 (Guatemala)**.

> Ojo: el reto permite **un juego por cuenta de Open2**. Ya existen Chicken Bus y Rebobinar; MIMESIS tendría que reemplazar a uno de ellos, no acompañarlo.

---

## Créditos

Hecho para el reto **build&play** de Open2 (Build & Pitch · UVG · 21 nov 2026).
