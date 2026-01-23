import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Users, Lock, Hexagon } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password !== '123') {
      setError('Contraseña incorrecta (Usa: 123)');
      return;
    }

    let role = '';
    let path = '';

    const userLower = username.toLowerCase().trim();

    if (userLower === 'cliente') {
      role = 'client';
      path = '/client';
    } else if (userLower === 'admin') {
      role = 'client-admin';
      path = '/client-admin';
    } else if (userLower === 'spi') {
      role = 'spi-admin';
      path = '/spi-admin';
    } else {
      setError('Usuario no reconocido. Usa: cliente, admin, o spi');
      return;
    }
    
    const success = login(role);
    if (success) {
      navigate(path);
    } else {
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden">
        
        {/* Left Side - Hero */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary p-12 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-400 via-primary to-primary"></div>
          
          <div className="relative z-10 flex flex-col justify-center h-full">
            <div className="mb-6">
              <img src="/spi-logo.png" alt="SPI Americas" className="h-24 w-auto bg-white p-4 rounded-xl shadow-lg" />
            </div>
            {/* <h1 className="text-4xl font-bold mb-4">SPI Americas</h1> removed as requested */}
            <p className="text-xl text-slate-200 font-light">Gestión inteligente de Propiedad Intelectual y Asuntos Regulatorios.</p>
          </div>

          <div className="relative z-10 text-sm text-slate-400">
            © 2026 SPI Americas. Todos los derechos reservados.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido</h2>
          <p className="text-slate-500 mb-8">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="ej. cliente, admin, spi"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="Ingresa 123"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
               Usuarios demo: <span className="font-mono text-slate-600">cliente</span>, <span className="font-mono text-slate-600">admin</span>, <span className="font-mono text-slate-600">spi</span>
             </p>
             <p className="text-xs text-slate-400 mt-1">Clave: <span className="font-mono text-slate-600">123</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
