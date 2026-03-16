import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const home = user?.role === 'spi-admin'
    ? '/spi-admin'
    : user?.role === 'client'
    ? '/client'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md text-center px-8">
        <p className="text-8xl font-black text-slate-200 mb-4">404</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Página no encontrada</h1>
        <p className="text-slate-500 font-medium mb-8">
          La dirección que buscas no existe o fue movida.
        </p>
        <button
          onClick={() => navigate(home)}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
