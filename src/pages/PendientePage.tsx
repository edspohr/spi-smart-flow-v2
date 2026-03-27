import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PendientePage = () => {
    const { user, loading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login', { replace: true });
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <Clock className="h-9 w-9 text-amber-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
                    Cuenta pendiente de activación
                </h1>

                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Tu solicitud de acceso ha sido recibida. El equipo de SPI Americas revisará tu cuenta y te notificará por correo cuando esté lista.
                </p>

                <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="flex items-center gap-2 mx-auto border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                </Button>

                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest mt-8">
                    © 2026 SPI Smart Flow
                </p>
            </div>
        </div>
    );
};

export default PendientePage;
