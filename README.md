# Space Invaders — tribute build

Um Space Invaders de arcade feito à mão em canvas, sem dependências e sem build.
Abre no navegador e joga.

## Jogar

Abra `index.html` (duplo clique basta). Tudo roda local, inclusive o som.

| Tecla | Ação |
| --- | --- |
| `←` `→` ou `A` `D` | mover a nave |
| `Espaço` | atirar (um tiro por vez, como em 1978) |
| `P` ou `Esc` | pausar |
| `M` | ligar/desligar o som |
| `Enter` | começar / reiniciar |

No celular aparecem três botões na parte de baixo: esquerda, fogo e direita.
O recorde fica salvo no `localStorage` do navegador.

## Regras

- Frota de 11 × 5 alienígenas; ela marcha mais rápido conforme você elimina unidades
  e desce um degrau a cada borda atingida.
- Pontuação: lula 30, caranguejo 20, polvo 10. Disco voador vale 50, 100, 150 ou 300.
- Vida extra aos 1500 pontos.
- Os quatro escudos erodem célula a célula: seus tiros também os destroem, então
  não atire por baixo deles.
- Se a frota chegar na altura da nave, é fim de jogo.
- Cada onda reinicia a frota e os escudos, mantendo pontos e vidas.

## Como é feito

- `game.js` — motor completo: estado, colisões, renderização e áudio.
- `index.html` — moldura de gabinete, scanlines, vinheta e controles de toque.
- Canvas lógico de 560 × 760, escalado por CSS com `image-rendering: pixelated`.
- Sprites desenhados a partir de mapas de bits de 8 × 8 e pré-renderizados em
  canvas fora de tela; a fonte 5 × 7 dos placares é desenhada pixel a pixel.
- As faixas de celofane do gabinete original são reproduzidas com
  `globalCompositeOperation = 'multiply'`: vermelho no topo, branco no meio,
  verde embaixo — por isso a frota muda de cor conforme desce.
- Áudio 100% sintetizado com WebAudio (osciladores e ruído), sem arquivos.

## Ajustes rápidos

As constantes ficam no topo de `game.js`:

- `COLW` / `ROWH` — espaçamento da frota.
- velocidade da marcha: `(11 + wave * 4)` em `updateFleet`.
- `BAND1` / `BAND2` — altura das faixas coloridas.
- `player.speed`, `maxBombs()`, `bombTimer` — dificuldade.

## Prévia

`preview/title.png` e `preview/gameplay.png`.
