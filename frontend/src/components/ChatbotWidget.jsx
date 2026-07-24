import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

export default function ChatbotWidget({ isLight }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente virtual de CazaOfertasML. ¿Qué producto o descuento estás buscando hoy?',
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow]);

  const renderMessageTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 underline hover:text-yellow-300 break-all font-semibold"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSendChatMessage = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const lowerText = userText.toLowerCase();
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    if (
      lowerText.includes('unirse') ||
      lowerText.includes('grupo') ||
      lowerText.includes('telegram') ||
      lowerText.includes('facebook') ||
      lowerText.includes('comunidad')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Claro que sí! Aquí tienes nuestros canales oficiales para no perderte ninguna oferta:\n💬 WhatsApp Grupo: https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1\n💬 WhatsApp Canal: https://whatsapp.com/channel/0029Vb6HXPR3wtbIPP0vUT1m\n✈ Telegram: https://t.me/LadyOfertas2026\n📘 Facebook: https://www.facebook.com/CazaOfertasml1\n⚠️ Recuerda que los precios y disponibilidad pueden cambiar en cualquier momento sin previo aviso.',
          },
        ]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userText,
        history: newHistory.slice(-6),
      });
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: response.data.reply },
      ]);
    } catch (error) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Excelente pregunta! Revisa nuestro carrusel de productos destacados o escríbenos por WhatsApp para darte atención inmediata. (Los precios y disponibilidad pueden cambiar en cualquier momento sin previo aviso).',
          },
        ]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={`fixed right-5 bottom-24 z-50 w-[92%] max-w-sm rounded-3xl shadow-2xl border overflow-hidden flex flex-col h-[480px] ${
              isLight
                ? 'bg-white border-yellow-300 text-gray-800'
                : 'bg-neutral-900 border-yellow-400/50 text-neutral-100'
            }`}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-black flex items-center justify-between font-bold border-b border-yellow-300">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-black text-yellow-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm leading-tight">
                    Asistente IA CazaOfertasML
                  </p>
                  <span className="text-[10px] text-neutral-800 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />{' '}
                    En línea
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowChatWindow(false)}
                className="text-black hover:opacity-70 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`flex-1 p-4 overflow-y-auto space-y-3 text-sm whitespace-pre-line ${
                isLight ? 'bg-gray-50' : 'bg-neutral-950'
              }`}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-yellow-400 text-black rounded-br-none font-medium'
                        : isLight
                        ? 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-100'
                        : 'bg-neutral-800 text-neutral-100 shadow-md rounded-bl-none border border-neutral-700'
                    }`}
                  >
                    {renderMessageTextWithLinks(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className={`p-3 rounded-2xl shadow-sm italic text-xs animate-pulse ${
                      isLight
                        ? 'bg-white text-gray-400'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    El asistente está escribiendo...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div
              className={`px-3 py-2 border-b flex flex-wrap gap-1.5 text-xs ${
                isLight
                  ? 'bg-yellow-50 border-gray-200'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <span className="text-neutral-500 font-semibold w-full mb-0.5">
                Preguntas frecuentes:
              </span>
              <button
                onClick={() =>
                  setInputMessage('¿Cómo puedo unirme a la comunidad?')
                }
                className={`px-2.5 py-1 rounded-full border transition-all font-medium ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                💬 Unirme a comunidad
              </button>
              <button
                onClick={() => setInputMessage('Quiero ver cupones')}
                className={`px-2.5 py-1 rounded-full border transition-all font-medium ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                ✨ Ver cupones
              </button>
              <button
                onClick={() => setInputMessage('Busco una oferta de pantalla')}
                className={`px-2.5 py-1 rounded-full border transition-all font-medium ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                🔥 Buscar ofertas
              </button>
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className={`p-3 border-t flex gap-2 ${
                isLight
                  ? 'bg-white border-gray-200'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu duda u oferta..."
                className={`flex-1 px-4 py-2 text-sm border rounded-xl focus:outline-none focus:border-yellow-400 ${
                  isLight
                    ? 'bg-white border-gray-300 text-gray-800'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-100'
                }`}
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-xl font-bold flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        id="chatbot-fab"
        data-chatbot-slot="customer-service"
        onClick={() => setShowChatWindow(!showChatWindow)}
        className="fixed right-5 bottom-5 z-40 group cursor-pointer"
        aria-label="Abrir chat de atención"
      >
        <span className="absolute inset-0 rounded-full bg-yellow-400/40 blur-xl group-hover:blur-2xl transition" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-2xl shadow-yellow-400/50 border-2 border-yellow-300">
          <Bot className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-950" />
        </span>
      </motion.button>
    </>
  );
}