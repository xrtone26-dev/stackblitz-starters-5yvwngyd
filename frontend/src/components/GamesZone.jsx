import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2, User, Trophy, Play, Pause, Info, Sparkles, Volume2, VolumeX, SkipForward, Music, RefreshCw, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import SpiderGameUI from './games/SpiderGame.jsx';

export default function GamesZone({ currentUser, isLight }) {
  // ESTADOS GLOBALES DE LA ZONA RECREATIVA
  const [activeGame, setActiveGame] = useState('catcher');
  const [gamePhase, setGamePhase] = useState('menu'); // menu, tutorial, credits, difficulty, rules, countdown, playing, gameover

  // ESTADOS DEL JUEGO Atrapa Ofertas (Catcher)
  const [catcherScore, setCatcherScore] = useState(0);
  const [catcherLevel, setCatcherLevel] = useState(1);
  const [catcherLives, setCatcherLives] = useState(3);
  const [catcherIsPaused, setCatcherIsPaused] = useState(false);
  const [catcherCountdown, setCatcherCountdown] = useState(5);
  const [catcherItems, setCatcherItems] = useState(0);
  
  // ESTADOS DE REGLAS Y AUDIO
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isEffectsMuted, setIsEffectsMuted] = useState(false);
  const [showRules, setShowRules] = useState(true);

  // ESTADOS DEL JUEGO Memorama (Memory)
  const [memoryLives, setMemoryLives] = useState(5);
  const [memoryLevel, setMemoryLevel] = useState(1);
  const [memoryScore, setMemoryScore] = useState(0);
  const [memoryCards, setMemoryCards] = useState([]);
  const [memoryFlipped, setMemoryFlipped] = useState([]);
  const [memoryIsChecking, setMemoryIsChecking] = useState(false);
  const [memoryLevelingUp, setMemoryLevelingUp] = useState(false);
  const [memoryPauseCountdown, setMemoryPauseCountdown] = useState(0);
  const [memoryIsPaused, setMemoryIsPaused] = useState(false);

  // ESTADOS DEL JUEGO Solitario Clásico (Klondike)
  const [solitaireScore, setSolitaireScore] = useState(0);
  const [solitaireMoves, setSolitaireMoves] = useState(0);
  const [solitaireTime, setSolitaireTime] = useState(0);
  const [solitaireIsPaused, setSolitaireIsPaused] = useState(false);
  const [solitaireDifficulty, setSolitaireDifficulty] = useState('easy'); 
  const [solitaireStuck, setSolitaireStuck] = useState(false);

  const canvasRef = useRef(null);
  const mousePosRef = useRef({ x: -100, y: -100 });

  // -------------------------------------------------------------
  // SISTEMA DE AUDIO SINTETIZADO (Web Audio API)
  // -------------------------------------------------------------
  const audioCtxRef = useRef(null);
  const bgMusicIntervalRef = useRef(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSoundEffect = (type) => {
    if (isEffectsMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'boom') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'pause') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'levelup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pausa con Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && gamePhase === 'playing') {
        playSoundEffect('pause');
        if (activeGame === 'catcher') setCatcherIsPaused(prev => !prev);
        if (activeGame === 'memory') setMemoryIsPaused(prev => !prev);
        if (activeGame === 'solitaire') setSolitaireIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, activeGame]);

  const baseLeaderboard = [
    { name: 'OfertaKing', score: 1540 },
    { name: 'Irving', score: 840 },
    { name: 'LadyDescuentos', score: 620 },
    { name: 'AhorroMax', score: 410 },
  ];

  const getCurrentScore = () => {
    switch (activeGame) {
      case 'catcher': return catcherScore;
      case 'memory': return memoryScore;
      case 'solitaire': return solitaireScore;
      case 'spider': return 500; // O el score que maneje spider
      default: return 0;
    }
  };

  const currentLeaderboard = [
    ...baseLeaderboard,
    { name: currentUser || 'Tú', score: getCurrentScore(), isMe: true },
  ].sort((a, b) => b.score - a.score);

  const handleStartGameFlow = () => {
    const hasSeenTutorial = localStorage.getItem(`tutorial_${activeGame}`);
    if (!hasSeenTutorial) {
      setGamePhase('tutorial');
    } else {
      setGamePhase('credits');
    }
  };

  const triggerDifficultySelection = () => {
    if (activeGame === 'solitaire') {
      setGamePhase('difficulty');
    } else {
      setGamePhase('rules');
    }
  };

  const triggerCountdown = () => {
    setGamePhase('countdown');
    setSolitaireStuck(false);
    if (activeGame === 'catcher') {
      setCatcherScore(0);
      setCatcherLives(3);
      setCatcherLevel(1);
      setCatcherIsPaused(false);
      setCatcherCountdown(5);
      setCatcherItems(0);
    }
  };

  useEffect(() => {
    if (gamePhase === 'credits') {
      const timer = setTimeout(() => {
        localStorage.setItem(`credits_${activeGame}`, 'true');
        triggerDifficultySelection();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, activeGame]);

  useEffect(() => {
    if (gamePhase === 'countdown') {
      setCatcherCountdown(5);
      let currentCd = 5;
      const timer = setInterval(() => {
        currentCd--;
        setCatcherCountdown(currentCd);
        if (currentCd <= 0) {
          clearInterval(timer);
          setGamePhase('playing');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, activeGame]);

  const solitaireStateRef = useRef({
    stock: [], waste: [], foundations: [[], [], [], []], tableaus: [[], [], [], [], [], [], []], dragging: null, history: []
  });

  const saveSolitaireHistory = () => {
    const state = solitaireStateRef.current;
    state.history.push({
      stock: JSON.parse(JSON.stringify(state.stock)),
      waste: JSON.parse(JSON.stringify(state.waste)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
      tableaus: JSON.parse(JSON.stringify(state.tableaus)),
      score: solitaireScore,
      moves: solitaireMoves
    });
  };

  const undoSolitaireMove = () => {
    const state = solitaireStateRef.current;
    if (state.history.length === 0) return;
    const prev = state.history.pop();
    state.stock = prev.stock;
    state.waste = prev.waste;
    state.foundations = prev.foundations;
    state.tableaus = prev.tableaus;
    setSolitaireScore(prev.score);
    setSolitaireMoves(prev.moves + 1);
    setSolitaireStuck(false);
    playSoundEffect('pause');
  };

  return (
    <div className="container mx-auto px-4 mb-16 relative z-10">
      <div className={`rounded-3xl shadow-xl p-6 md:p-8 backdrop-blur-xl border ${isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'}`}>
        <h2 className={`text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2 ${isLight ? 'text-purple-700' : 'text-neutral-100 font-black'}`}>
          <Gamepad2 className="w-8 h-8 text-yellow-400" /> ZONA DE RECREACIÓN LADYOFERTAS
        </h2>

        {/* SELECTOR DE JUEGOS ACTUALIZADO */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => { setActiveGame('catcher'); setGamePhase('menu'); }}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${activeGame === 'catcher' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
          >
            Atrapa Ofertas
          </button>
          <button
            onClick={() => { setActiveGame('memory'); setGamePhase('menu'); }}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${activeGame === 'memory' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
          >
            Memorama
          </button>
          <button
            onClick={() => { setActiveGame('solitaire'); setGamePhase('menu'); }}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${activeGame === 'solitaire' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
          >
            Solitario Clásico
          </button>
          <button
            onClick={() => { setActiveGame('spider'); setGamePhase('playing'); }}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${activeGame === 'spider' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
          >
            Spider Solitaire
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* PANEL IZQUIERDO: TU SCORE */}
          <div className="w-full lg:w-64 shrink-0 bg-gradient-to-b from-red-500 to-red-700 rounded-2xl p-5 text-white shadow-lg border border-red-400 relative overflow-hidden">
            <h3 className="text-center font-black text-lg mb-4 flex items-center justify-center gap-2">
              <User className="w-5 h-5" /> Tu Score
            </h3>
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <p className="text-sm text-red-200 font-bold">{currentUser || 'Jugador'}</p>
              <p className="text-4xl font-black text-yellow-300 mt-2">{getCurrentScore()}</p>
              <p className="text-xs mt-1 uppercase tracking-widest text-red-200">Puntos</p>
            </div>
          </div>

          {/* ÁREA CENTRAL DEL JUEGO */}
          <div className="flex flex-col gap-3">
            {activeGame === 'solitaire' && gamePhase === 'playing' && (
              <div className="w-[840px] flex justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-md">
                <button onClick={() => undoSolitaireMove()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow flex items-center gap-1.5 text-xs">
                  <RotateCcw size={14} /> Deshacer
                </button>
                <div className="text-sm font-bold text-white">
                  Nivel: <span className="text-yellow-400">{solitaireDifficulty === 'easy' ? 'Fácil' : 'Difícil'}</span> | Movimientos: <span className="text-yellow-400">{solitaireMoves}</span>
                </div>
              </div>
            )}

            <div className="relative w-[840px] min-w-[840px] h-[620px] bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-2xl">
              {activeGame === 'spider' ? (
                <SpiderGameUI playSoundEffect={playSoundEffect} />
              ) : (
                <>
                  {gamePhase === 'menu' && (
                    <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center z-30">
                      <Gamepad2 className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                      <h3 className="text-2xl font-black text-white mb-6 uppercase">
                        {activeGame === 'catcher' ? 'Atrapa Ofertas' : activeGame === 'memory' ? 'Memorama' : 'Solitario Clásico'}
                      </h3>
                      <button onClick={handleStartGameFlow} className="flex items-center gap-2 px-8 py-4 bg-yellow-400 text-black font-black rounded-full shadow-lg hover:scale-110 transition-all">
                        <Play className="w-6 h-6 fill-current" /> JUGAR AHORA
                      </button>
                    </div>
                  )}

                  {gamePhase === 'credits' && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40 p-6 text-center">
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 uppercase">Desarrollado por</h2>
                      <h1 className="text-5xl font-black text-white mb-6">Omar Navarro</h1>
                      <div className="inline-block bg-yellow-400/20 border border-yellow-400/50 rounded-full px-6 py-2">
                        <p className="text-yellow-400 font-bold">UNA CREACIÓN DE CAZAOFERTAS</p>
                      </div>
                    </div>
                  )}

                  {gamePhase === 'difficulty' && (
                    <div className="absolute inset-0 bg-neutral-950 z-50 flex flex-col items-center justify-center p-8 text-white text-center">
                      <h3 className="text-3xl font-black text-yellow-400 mb-4">SELECCIONA EL MODO DE JUEGO</h3>
                      <div className="flex gap-6">
                        <button onClick={() => { setSolitaireDifficulty('easy'); setGamePhase('rules'); }} className="px-8 py-5 bg-green-600 rounded-2xl shadow-lg hover:scale-105 flex flex-col items-center gap-2">
                          <span className="text-xl font-bold">🟢 MODO FÁCIL</span>
                          <span className="text-xs text-green-200">Cartas abiertas para jugabilidad fluida</span>
                        </button>
                        <button onClick={() => { setSolitaireDifficulty('hard'); setGamePhase('rules'); }} className="px-8 py-5 bg-red-600 rounded-2xl shadow-lg hover:scale-105 flex flex-col items-center gap-2">
                          <span className="text-xl font-bold">🟡 MODO DIFÍCIL</span>
                          <span className="text-xs text-red-200">Cartas ocultas tradicional</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {gamePhase === 'rules' && (
                    <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-8 text-white text-center">
                      <h3 className="text-2xl font-black text-yellow-400 mb-4">REGLAS DEL JUEGO</h3>
                      <p className="mb-6 max-w-md">Mueve todas las cartas a las 4 fundaciones del As al Rey por palo.</p>
                      <button onClick={() => setGamePhase('playing')} className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-xl">¡A JUGAR!</button>
                    </div>
                  )}

                  {gamePhase === 'playing' && (
                    <canvas ref={canvasRef} width={840} height={620} className="bg-neutral-950 rounded-xl w-full h-full cursor-pointer" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: TOP GLOBAL */}
          <div className="w-full lg:w-64 shrink-0 bg-gradient-to-b from-blue-600 to-blue-900 rounded-2xl p-5 text-white shadow-lg border border-blue-400">
            <h3 className="text-center font-black text-lg mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Top Global
            </h3>
            <div className="space-y-3">
              {currentLeaderboard.map((player, index) => (
                <div key={index} className={`flex justify-between items-center p-2 rounded-lg ${player.isMe ? 'bg-yellow-400 text-black font-bold' : 'bg-black/30'}`}>
                  <span>#{index + 1} {player.name}</span>
                  <span className="font-black">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}