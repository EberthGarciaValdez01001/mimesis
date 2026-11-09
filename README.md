# MIMESIS

> El gusano te copia. Tienes 6 vidas en Medio, una linterna y una pistola.

Boss fight biolab para el reto **build&play** de Open2 / Build & Pitch 2026.

El laboratorio se quedó a oscuras. La linterna apunta **hacia donde te mueves**; cada **6–9 s** un destello revela la sala entera durante ~1 s y vuelve la oscuridad. Tienes **6 vidas en Medio** (8 en Fácil, 4 en Difícil). Cada golpe del gusano te quita una vida y crea una **copia tuya** que te persigue; cada disparo que destruye un segmento **disuelve una copia**. La pistola tiene **6 balas y recarga de 1.1 s**.

**32 KB · pixel art · sin librerías · sin imágenes · sin audio · sin fuentes externas.**
Todo se dibuja y suena con código. El mundo se renderiza a 480×270 y se escala con nearest-neighbor; el HUD y los menús quedan nítidos.

---

## Jugar

- **Modo:** elige **Fácil / Medio / Difícil** en el menú con clic/tap o `1` / `2` / `3`. Se guarda para la próxima.
- **Moverte y encarar:** `WASD` / flechas / joystick virtual. La linterna apunta en la dirección en la que te mueves.
- **Disparar:** `Espacio`, `J`, `K`, clic izquierdo o el botón **FUEGO**.
- **Recargar:** automático al gastar las 6 balas; tarda **1.1 s**.
- **Pausa:** `P` o `Esc`, o el botón de pausa junto al altavoz.
- **Silenciar:** `M` o el icono del altavoz.
- **Girar el teléfono:** el juego es horizontal; si abres el link en vertical verás el aviso para girar.

La pistola **solo apunta a segmentos visibles**: dentro del cono de la linterna, dentro de la luz mínima del cuerpo o durante el destello global. Para disparar a distancia tienes que **encarar** al gusano; para esquivar tienes que moverte. El loop es “parar, encarar, disparar, recargar, mover”.

La **cabeza está blindada** hasta que destruyas los 9 segmentos del cuerpo. Después queda expuesta y son **2 disparos finales**.

Al terminar se muestra el **rango** (S/A/B/C), el tiempo, los disparos y las copias disueltas.

---

## Modos

| Modo | Vidas | Copias | Vel. gusano | Invuln. | Lunge | Baba | Alcance | Cadencia | Vel. copias |
|---|---|---|---|---|---|---|---|---|---|
| **Fácil** | 8 | máx. 5 | 85% | 1.6 s | 4.4 s | 3.6 s | 230 px | 0.32 s | 80% |
| **Medio** | 6 | máx. 8 | 115% | 1.1 s | 3.2 s | 2.4 s | 195 px | 0.38 s | 94% |
| **Difícil** | 4 | máx. 10 | 130% | 0.8 s | 2.4 s | 1.8 s | 160 px | 0.44 s | 102% |

La velocidad del gusano es relativa a su base; la de las copias, a la tuya. En la fase final los tiempos de lunge y baba bajan hasta **2.1 s** y **1.5 s**. La recarga es igual en todos los modos: **6 balas + 1.1 s**.

## Reglas

| Regla | Detalle |
|---|---|
| **Gusano** | 10 segmentos: 9 de cuerpo + 1 cabeza |
| **Disparos** | 2 por segmento = **20 impactos** |
| **Cabeza** | Blindada hasta destruir el cuerpo; luego 2 disparos |
| **Vidas** | 8 / 6 / 4 según el modo, sin curación |
| **Golpe del gusano** | Contacto o baba = **−1 vida + 1 copia** |
| **Golpe de una copia** | **−1 vida**, pero no crea otra copia |
| **Copias** | Invulnerables, persecución directa al **80–102%** de tu velocidad, máximo **5 / 8 / 10** |
| **Copias de fase** | Nace una al llegar a cuerpo 7, cuerpo 4 y cabeza expuesta |
| **Disparo** | Hitscan al segmento visible más cercano dentro del alcance; destruye el segmento y disuelve la copia más cercana |
| **Linterna** | Cono de ~63° y 300 px en la dirección en la que te mueves; luz mínima de ~40 px en el cuerpo |
| **Destello** | Cada 6–9 s revela la sala durante ~1 s; durante el destello la pistola puede apuntar a cualquier segmento dentro del alcance |
| **Recarga** | 6 balas; 1.1 s; no se puede disparar mientras recarga |
| **Victoria** | Destruir los 10 segmentos |
| **Derrota** | Quedarte sin vidas: “TE COPIARON” |

### El loop

> El gusano te toca → pierdes una vida y nace tu copia → encaras y disparas un segmento → se disuelve una copia → recargas → el gusano se acorta y se enfurece → llegan las copias de fase → repites.

Disparar es progreso **y** limpieza. Sin esa regla, el juego se volvería imposible muy rápido.

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
| **32 KB máximo, sin comprimir** | `index.html` (797 B) + `game.min.js` (31,647 B) = **32,444 bytes** (99.0% del límite). `npm run build` lo verifica. |
| **Solo código propio** | Canvas 2D, WebAudio y `localStorage`. Sin engines ni frameworks. Terser solo se usa en build; no se sirve. |
| **Cero assets** | No hay imágenes, audio, fuentes ni base64. Todo el arte es procedural y todo el sonido se sintetiza con osciladores y ruido. |
| **Repo nuevo y link jugable** | Este repo + GitHub Pages (ver abajo). |
| **Original** | Jefe, mecánica, personaje y escenario propios. Sin personajes ni assets de otros juegos. |
| **Un juego por cuenta** | Es el **primer envío** de la cuenta de Open2. |

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
- **Sprites procedurales:** el agente (32×32) con pistola, las copias y el gusano (cabeza 60×60, segmentos 42×42) se generan en canvas al iniciar. No hay PNGs ni assets.
- **Oscuridad y linterna:** el buffer de 480×270 se reutiliza como máscara. Se rellena de negro y se perfora con `destination-out` para el cono de la linterna y una luz mínima alrededor del cuerpo; luego se pinta sobre la escena. El destello global baja la opacidad y añade un flash blanco suave.
- **Visibilidad real:** la pistola solo puede apuntar a segmentos dentro del cono, dentro de la luz del cuerpo o durante el destello. Las copias y el gusano se delatan con ojos brillantes; la baba y el telegrafiado del lunge se dibujan por encima de la oscuridad.
- **Pistola autoapuntada:** elige el segmento visible más cercano dentro del alcance; prioriza los dañados. Disparo hitscan con trazadora, muzzle flash, chispa de impacto, retroceso y sonido.
- **Recarga:** 6 balas, 1.1 s, pips en el HUD y anillo de recarga. La recarga es la ventana en la que el gusano y las copias te castigan.
- **Gusano 1.5×:** cabeza 60×60, segmentos 42×42, radios 28/22 y separación 42. El cuerpo sigue a la cabeza con una restricción de distancia; cada segmento se puede destruir y la cadena se reconecta.
- **Copias:** se crean alrededor del jugador al recibir un golpe y al cambiar de fase; se forman durante un tiempo, persiguen directo al 80–102% de la velocidad y son invulnerables. El jugador tiene invulnerabilidad temporal.
- **Baba:** proyectiles telegrafiados desde la boca; si aciertan, cuentan como golpe del gusano.
- **Fases:** el gusano acelera y ataca más seguido a medida que pierde segmentos; la cabeza expuesta es la fase final.
- **Audio sintetizado:** hum de laboratorio, pistola, impactos, recarga, copias, baba, destello, alarma y latido cuando quedan pocas vidas.
- **Sin dependencias en runtime.**

---

## Deploy en GitHub Pages

1. Crea un repositorio **público** nuevo, por ejemplo `mimesis`.
2. Conecta y sube:

```bash
git remote add origin https://github.com/TU-USUARIO/mimesis.git
git branch -M main
git push -u origin main
```

3. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
4. El juego queda en `https://TU-USUARIO.github.io/mimesis/`.

`game.min.js` ya está commiteado. Si cambias `src/game.js`, corre `npm run build` y commitea el nuevo `game.min.js`.

El **cover** de Open2 se sube aparte; no forma parte del build de 32 KB y se mantiene fuera del repo del juego para no romper la regla de “cero assets”.

---

## Checklist antes de enviar

- [ ] Repo público creado **durante** el reto.
- [ ] GitHub Pages activo y link probado en escritorio y teléfono.
- [ ] `npm run build` termina sin error y muestra menos de 32,768 bytes.
- [ ] Probar mover/encarar, disparar, recargar, copias, copias de fase, baba, linterna, destello, pausa, mute, portrait, victoria, derrota y reinicio en móvil.
- [ ] Crear cuenta de Open2 y enviar en `https://app.open2.io/play` antes del **13 nov 2026, 23:59 (Guatemala)**.
- [ ] Subir el cover en Open2.
- [ ] Votación: **14–20 nov**; el más votado gana.

---

## Créditos

Hecho para el reto **build&play** de Open2 (Build & Pitch · UVG · 21 nov 2026).
