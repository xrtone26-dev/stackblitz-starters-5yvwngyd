import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, RotateCcw, Play, RefreshCw, Trophy } from 'lucide-react';

export class SpiderSolitaireEngine {
  constructor(canvas, soundManager, onUpdateStats, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = soundManager;
    this.updateStats = onUpdateStats;
    this.onGameOver = onGameOver;

    this.cardW = 60;
    this.cardH = 86;
    this.paddingX = 14;
    this.topMargin = 15;

    this.suitsCount = 1;
    this.stock = [];
    this.tableaus = [[], [], [], [], [], [], [], [], [], []];
    this.foundations = [];
    this.dragging = null;
    this.history = [];

    this.score = 500;
    this.moves = 0;
    this.time = 0;
    this.timerInterval = null;
    this.isPaused = false;
    this.isGameOver = false;

    this.setupListeners();
  }

  initGame(suitsCount = 1) {
    this.suitsCount = suitsCount;
    this.score = 500;
    this.moves = 0;
    this.time = 0;
    this.isGameOver = false;
    this.history = [];
    this.dealCards();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.time++;
        this.updateStats({ score: this.score, moves: this.moves, time: this.time });
      }
    }, 1000);
  }

  dealCards() {
    let suitTypes = ['spades'];
    if (this.suitsCount === 2) suitTypes = ['spades', 'hearts'];
    if (this.suitsCount === 4) suitTypes = ['spades', 'hearts', 'clubs', 'diamonds'];

    let deck = [];
    for (let b = 0; b < 2; b++) {
      suitTypes.forEach(suit => {
        for (let r = 1; r <= 13; r++) {
          deck.push({
            suit,
            rank: r,
            value: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][r - 1],
            color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
            faceUp: false
          });
        }
      });
    }

    while (deck.length < 104) {
      let template = deck[Math.floor(Math.random() * deck.length)];
      deck.push({ ...template });
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.tableaus = [[], [], [], [], [], [], [], [], [], []];
    for (let i = 0; i < 10; i++) {
      let count = i < 4 ? 6 : 5;
      for (let j = 0; j < count; j++) {
        let card = deck.pop();
        card.faceUp = (j === count - 1);
        this.tableaus[i].push(card);
      }
    }
    this.stock = deck;
    this.foundations = [];
  }

  setupListeners() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isGameOver || this.isPaused) return;
      const pos = getPos(e);
      this.handleMouseDown(pos.x, pos.y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const pos = getPos(e);
      this.dragging.currentX = pos.x;
      this.dragging.currentY = pos.y;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.dragging) return;
      const pos = getPos(e);
      this.handleMouseUp(pos.x, pos.y);
    });
  }

  handleMouseDown(x, y) {
    let totalW = 10 * this.cardW + 9 * this.paddingX;
    let startX = (this.canvas.width - totalW) / 2;
    let stockX = startX;
    let stockY = this.topMargin;

    if (x >= stockX && x <= stockX + this.cardW && y >= stockY && y <= stockY + this.cardH) {
      if (this.stock.length >= 10) {
        if (this.tableaus.some(col => col.length === 0)) return;
        this.saveHistory();
        for (let i = 0; i < 10; i++) {
          let card = this.stock.pop();
          card.faceUp = true;
          this.tableaus[i].push(card);
        }
        this.moves++;
        this.sound.play('card');
        this.checkCompletedSequences();
      }
      return;
    }

    for (let i = 0; i < 10; i++) {
      let col = this.tableaus[i];
      let colX = startX + i * (this.cardW + this.paddingX);
      let tableauY = this.topMargin + this.cardH + 15;

      for (let j = col.length - 1; j >= 0; j--) {
        let card = col[j];
        if (!card.faceUp) break;

        let isValidSeq = true;
        for (let k = j; k < col.length - 1; k++) {
          if (col[k].suit !== col[k + 1].suit || col[k].rank !== col[k + 1].rank + 1) {
            isValidSeq = false;
            break;
          }
        }

        let cardY = tableauY;
        for (let idx = 0; idx < j; idx++) {
          cardY += col[idx].faceUp ? 28 : 10;
        }

        let visibleH = (j === col.length - 1) ? this.cardH : 28;

        if (isValidSeq && x >= colX && x <= colX + this.cardW && y >= cardY && y <= cardY + visibleH + 10) {
          this.dragging = {
            sourceCol: i,
            cardIndex: j,
            cards: col.slice(j),
            startX: x, startY: y,
            currentX: x, currentY: y,
            offsetX: x - colX,
            offsetY: y - cardY
          };
          return;
        }
      }
    }
  }

  handleMouseUp(x, y) {
    let totalW = 10 * this.cardW + 9 * this.paddingX;
    let startX = (this.canvas.width - totalW) / 2;

    for (let i = 0; i < 10; i++) {
      let colX = startX + i * (this.cardW + this.paddingX);
      let col = this.tableaus[i];
      let tableauY = this.topMargin + this.cardH + 15;
      let colH = col.length > 0 ? (col.length - 1) * 28 + this.cardH : this.cardH;

      if (x >= colX && x <= colX + this.cardW && y >= tableauY && y <= tableauY + colH + 50) {
        let topCard = col.length > 0 ? col[col.length - 1] : null;
        let draggingCard = this.dragging.cards[0];

        if (!topCard || topCard.rank === draggingCard.rank + 1) {
          if (this.dragging.sourceCol !== i) {
            this.saveHistory();
            this.tableaus[i].push(...this.dragging.cards);
            col.splice(this.dragging.cardIndex, this.dragging.cards.length);

            let sourceCol = this.tableaus[this.dragging.sourceCol];
            if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
              sourceCol[sourceCol.length - 1].faceUp = true;
            }

            this.moves++;
            this.sound.play('card');
            this.checkCompletedSequences();
            break;
          }
        }
      }
    }
    this.dragging = null;
  }

  checkCompletedSequences() {
    for (let i = 0; i < 10; i++) {
      let col = this.tableaus[i];
      if (col.length >= 13) {
        let last13 = col.slice(col.length - 13);
        let isComplete = true;
        let suit = last13[0].suit;
        for (let k = 0; k < 13; k++) {
          if (last13[k].suit !== suit || last13[k].rank !== 13 - k) {
            isComplete = false;
            break;
          }
        }
        if (isComplete) {
          col.splice(col.length - 13, 13);
          this.foundations.push(last13);
          this.score += 100;
          this.sound.play('win');

          if (this.foundations.length === 8) {
            this.isGameOver = true;
            clearInterval(this.timerInterval);
            this.onGameOver(this.score, this.time);
          }

          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
          }
        }
      }
    }
  }

  saveHistory() {
    this.history.push({
      stock: JSON.parse(JSON.stringify(this.stock)),
      tableaus: JSON.parse(JSON.stringify(this.tableaus)),
      foundations: JSON.parse(JSON.stringify(this.foundations)),
      score: this.score,
      moves: this.moves
    });
  }

  undo() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.stock = prev.stock;
    this.tableaus = prev.tableaus;
    this.foundations = prev.foundations;
    this.score = prev.score;
    this.moves++;
    this.sound.play('click');
  }

  render() {
    this.ctx.fillStyle = '#0f5132';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let totalW = 10 * this.cardW + 9 * this.paddingX;
    let startX = (this.canvas.width - totalW) / 2;

    if (this.stock.length > 0) {
      this.ctx.fillStyle = '#1e3a8a';
      this.ctx.beginPath();
      this.ctx.roundRect(startX, this.topMargin, this.cardW, this.cardH, 6);
      this.ctx.fill();
      this.ctx.fillStyle = '#facc15';
      this.ctx.font = 'bold 10px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Mazo (${Math.floor(this.stock.length / 10)})`, startX + this.cardW / 2, this.topMargin + this.cardH / 2);
      this.ctx.textAlign = 'left';
    }

    this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.ctx.beginPath();
    this.ctx.roundRect(startX + totalW - this.cardW, this.topMargin, this.cardW, this.cardH, 6);
    this.ctx.fill();
    this.ctx.fillStyle = '#facc15';
    this.ctx.font = 'bold 10px Outfit';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`🏆 ${this.foundations.length}/8`, startX + totalW - this.cardW / 2, this.topMargin + this.cardH / 2);
    this.ctx.textAlign = 'left';

    let tableauY = this.topMargin + this.cardH + 15;
    for (let i = 0; i < 10; i++) {
      let colX = startX + i * (this.cardW + this.paddingX);
      let col = this.tableaus[i];
      let currentY = tableauY;

      this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      this.ctx.strokeRect(colX, tableauY, this.cardW, this.cardH);

      for (let j = 0; j < col.length; j++) {
        let card = col[j];
        let isDragged = this.dragging && this.dragging.sourceCol === i && j >= this.dragging.cardIndex;
        if (!isDragged) {
          this.drawCard(card, colX, currentY);
        }
        currentY += card.faceUp ? 28 : 10; // Espaciado vertical limpio para mostrar la carta anterior
      }
    }

    if (this.dragging) {
      let curX = this.dragging.currentX - this.dragging.offsetX;
      let curY = this.dragging.currentY - this.dragging.offsetY;
      for (let i = 0; i < this.dragging.cards.length; i++) {
        this.drawCard(this.dragging.cards[i], curX, curY + (i * 28));
      }
    }
  }

  drawCard(card, x, y) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
    this.ctx.shadowBlur = 4;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, this.cardW, this.cardH, 6);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#cbd5e1';
    this.ctx.stroke();

    if (card.faceUp) {
      this.ctx.fillStyle = card.color === 'red' ? '#ef4444' : '#0f172a';
      this.ctx.font = 'bold 12px Outfit';
      this.ctx.fillText(card.value, x + 6, y + 16);
      
      const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
      const sym = symbols[card.suit];

      // Dibuja exactamente el número de figuras/pips correspondiente al valor de la carta
      let pipsCount = card.rank; // 1 para As, 2 para 2, ..., 10 para 10
      this.ctx.font = '12px Outfit';
      this.ctx.textAlign = 'center';

      if (pipsCount <= 10) {
        // Renderiza el número exacto de figuras distribuidas en la carta
        for (let p = 0; p < pipsCount; p++) {
          let px = x + this.cardW / 2;
          let py = y + 25 + (p * (45 / Math.max(1, pipsCount - 1)));
          if (pipsCount === 1) py = y + this.cardH / 2;
          this.ctx.fillText(sym, px, py);
        }
      } else {
        // Para J, Q, K dibuja la figura representativa en grande al centro
        this.ctx.font = '24px Outfit';
        this.ctx.fillText(sym, x + this.cardW / 2, y + this.cardH / 2 + 8);
      }
      this.ctx.textAlign = 'left';
    } else {
      this.ctx.fillStyle = '#1e3a8a';
      this.ctx.beginPath();
      this.ctx.roundRect(x + 3, y + 3, this.cardW - 6, this.cardH - 6, 4);
      this.ctx.fill();
      this.ctx.fillStyle = '#facc15';
      this.ctx.font = 'bold 8px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('SPIDER', x + this.cardW / 2, y + this.cardH / 2);
      this.ctx.textAlign = 'left';
    }
  }
}

export default function SpiderGameUI({ playSoundEffect }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [phase, setPhase] = useState('menu');
  const [score, setScore] = useState(500);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [suits, setSuits] = useState(1);

  useEffect(() => {
    if (phase === 'playing' && canvasRef.current && !engineRef.current) {
      const soundMgr = { play: playSoundEffect };
      const engine = new SpiderSolitaireEngine(
        canvasRef.current,
        soundMgr,
        (stats) => {
          setScore(stats.score);
          setMoves(stats.moves);
          setTime(stats.time);
        },
        () => setPhase('gameover')
      );
      engine.initGame(suits);
      engineRef.current = engine;
    }

    let animId;
    if (phase === 'playing') {
      const loop = () => {
        if (engineRef.current) {
          engineRef.current.render();
        }
        animId = requestAnimationFrame(loop);
      };
      loop();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [phase, suits, playSoundEffect]);

  const handleStartGame = (selectedSuits) => {
    setSuits(selectedSuits);
    engineRef.current = null;
    setPhase('playing');
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      {phase === 'playing' && (
        <div className="w-full max-w-[760px] flex justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl shadow-md">
          <button 
            onClick={() => engineRef.current?.undo()} 
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow flex items-center gap-1 text-xs transition"
          >
            <RotateCcw size={12} /> Deshacer
          </button>
          <div className="text-xs font-bold text-white">
            Modo: <span className="text-yellow-400">{suits === 1 ? '1 Palo' : suits === 2 ? '2 Palos' : '4 Palos'}</span> | Movs: <span className="text-yellow-400">{moves}</span> | Tiempo: <span className="text-yellow-400">{time}s</span>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-[760px] h-[480px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-2xl">
        {phase === 'menu' && (
          <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center z-30 p-6 text-center">
            <Gamepad2 className="w-14 h-14 text-yellow-400 mb-3 animate-bounce" />
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Spider Solitaire Profesional</h3>
            <button onClick={() => setPhase('difficulty')} className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all text-sm">
              <Play className="w-5 h-5 fill-current" /> JUGAR AHORA
            </button>
          </div>
        )}

        {phase === 'difficulty' && (
          <div className="absolute inset-0 bg-neutral-950 z-50 flex flex-col items-center justify-center p-6 text-white text-center">
            <h3 className="text-2xl font-black text-yellow-400 mb-4">SELECCIONA LA DIFICULTAD</h3>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => handleStartGame(1)} className="px-5 py-3 bg-green-600 rounded-xl font-bold text-sm hover:scale-105 transition">🟢 1 Palo (Fácil)</button>
              <button onClick={() => handleStartGame(2)} className="px-5 py-3 bg-blue-600 rounded-xl font-bold text-sm hover:scale-105 transition">🔵 2 Palos (Medio)</button>
              <button onClick={() => handleStartGame(4)} className="px-5 py-3 bg-red-600 rounded-xl font-bold text-sm hover:scale-105 transition">🔴 4 Palos (Difícil)</button>
            </div>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 text-center p-6 text-white">
            <Trophy className="w-12 h-12 text-yellow-400 mb-3 animate-bounce" />
            <h3 className="text-2xl font-black text-yellow-400 mb-2">¡VICTORIA EN SPIDER!</h3>
            <p className="text-sm mb-4">Puntuación: {score} | Tiempo: {time}s</p>
            <button onClick={() => setPhase('menu')} className="px-6 py-2.5 bg-yellow-400 text-black font-black rounded-xl text-sm flex items-center gap-2">
              <RefreshCw size={16} /> Jugar de Nuevo
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={760} height={480} className="bg-neutral-950 rounded-xl w-full h-full cursor-pointer" />
      </div>
    </div>
  );
}