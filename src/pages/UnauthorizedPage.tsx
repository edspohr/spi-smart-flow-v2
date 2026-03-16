import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const home = user?.role === 'spi-admin'
    ? '/spi-admin'
    : user?.role === 'client'
    ? '/client'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md text-center px-8">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Acceso no autorizado</h1>
        <p className="text-slate-500 font-medium mb-8">
          No tienes permisos para acceder a esta sección. Contacta al administrador si crees que esto es un error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(home)}
            className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-colors"
          >
            Ir a mi portal
          </button>
          <button
            onClick={() => logout()}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
