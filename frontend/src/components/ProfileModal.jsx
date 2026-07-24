import React, { useState } from 'react';
import { User, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileModal({
  showProfilePanel,
  setShowProfilePanel,
  currentUser,
  setCurrentUser,
  isLight,
}) {
  const [authMode, setAuthMode] = useState('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regNombre, setRegNombre] = useState('');
  const [regNick, setRegNick] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👩‍🦰');
  const [recupInput, setRecupInput] = useState('');

  const intentarLogin = () => {
    if (!loginUser || !loginPass) {
      alert('¡No puedes cazar ofertas sin identificarte!');
      return;
    }
    if (sessionStorage.getItem('cambioObligatorio') === 'true') {
      const nuevaPass = prompt(
        '🔑 REGLA DE ORO: Ingresa tu NUEVA contraseña definitiva:'
      );
      if (nuevaPass && nuevaPass.length >= 4) {
        alert('✅ Contraseña actualizada correctamente. ¡Bienvenido cazador!');
        sessionStorage.removeItem('cambioObligatorio');
        setCurrentUser(loginUser);
        setAuthMode('login');
      } else {
        alert('Debes elegir una contraseña válida.');
      }
      return;
    }
    setCurrentUser(loginUser);
    alert(`¡Bienvenido de nuevo, ${loginUser}! 🚀`);
    setShowProfilePanel(false);
  };

  const recuperarAcceso = () => {
    if (!recupInput) {
      alert('Escribe tu correo o nombre de usuario');
      return;
    }
    const claveProv = 'LADY' + Math.floor(1000 + Math.random() * 9000);
    alert(
      `¡REGLA DE ORO ACTIVADA!\nSe ha enviado un correo a la dirección registrada (${recupInput}).\nClave Provisional: ${claveProv}\n\nIngresa con esta clave y podrás cambiarla.`
    );
    sessionStorage.setItem('cambioObligatorio', 'true');
    setAuthMode('login');
  };

  const finalizarRegistro = () => {
    if (!regNick || !regEmail || !regPass) {
      alert('¡Completa los campos básicos!');
      return;
    }
    alert(
      `¡Bienvenido/a ${regNick}! Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión.`
    );
    setAuthMode('login');
  };

  if (!showProfilePanel) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className={`relative rounded-3xl shadow-2xl p-8 max-w-md w-full border ${
          isLight
            ? 'bg-white border-purple-200'
            : 'bg-neutral-900 border-yellow-400/30'
        }`}
      >
        <button
          onClick={() => setShowProfilePanel(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2
            className={`text-2xl font-bold mb-4 flex items-center justify-center gap-2 ${
              isLight ? 'text-purple-700' : 'text-yellow-400'
            }`}
          >
            <User className="w-6 h-6" /> MI PERFIL LADYOFERTAS
          </h2>

          {currentUser ? (
            <div className="p-6 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-center">
              <span className="text-4xl block mb-2">{selectedAvatar}</span>
              <p className="text-lg font-bold text-white">
                ¡Hola, {currentUser}!
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Sesión activa como cazador de ofertas
              </p>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowProfilePanel(false);
                }}
                className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div>
              {authMode === 'login' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Correo o Nickname"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  <button
                    onClick={intentarLogin}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg"
                  >
                    Entrar
                  </button>
                  <p
                    onClick={() => setAuthMode('recovery')}
                    className="text-xs text-yellow-400 cursor-pointer underline hover:opacity-80"
                  >
                    ¿Olvidaste tu contraseña? (Regla de Oro)
                  </p>
                  <hr className="border-neutral-800 my-4" />
                  <button
                    onClick={() => setAuthMode('register')}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700 text-sm"
                  >
                    Crear Cuenta Nueva
                  </button>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        isLight
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-neutral-950 border-neutral-700 text-white'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Nickname"
                      value={regNick}
                      onChange={(e) => setRegNick(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        isLight
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-neutral-950 border-neutral-700 text-white'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={regTel}
                      onChange={(e) => setRegTel(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        isLight
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-neutral-950 border-neutral-700 text-white'
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        isLight
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-neutral-950 border-neutral-700 text-white'
                      }`}
                    />
                  </div>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />

                  <p className="text-xs text-neutral-400 mt-2">
                    Selecciona tu Avatar:
                  </p>
                  <div className="flex justify-center gap-3 text-2xl">
                    {['👩‍🦰', '👨‍🦱', '👸', '🦊', '🐯'].map((av) => (
                      <span
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`cursor-pointer p-2 rounded-xl transition-all ${
                          selectedAvatar === av
                            ? 'bg-yellow-400/30 border border-yellow-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                      >
                        {av}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={finalizarRegistro}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg mt-4"
                  >
                    Finalizar Registro
                  </button>
                  <p
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-neutral-400 text-center cursor-pointer underline mt-2"
                  >
                    Volver al inicio
                  </p>
                </div>
              )}

              {authMode === 'recovery' && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-400">
                    Ingresa tu correo o nombre de usuario para recibir la
                    clave provisional (Regla de Oro):
                  </p>
                  <input
                    type="text"
                    placeholder="Correo o Nickname"
                    value={recupInput}
                    onChange={(e) => setRecupInput(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  <button
                    onClick={recuperarAcceso}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg"
                  >
                    Recuperar Acceso
                  </button>
                  <p
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-neutral-400 cursor-pointer underline"
                  >
                    Cancelar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}