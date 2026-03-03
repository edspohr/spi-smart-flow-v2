import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
    const { user, signIn } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client-admin') navigate('/client-admin');
            else navigate('/client');
        }
    }, [user, navigate]);

    const getFirebaseErrorMessage = (code: string): string => {
        switch (code) {
            case 'auth/invalid-email':
                return 'El correo electrónico no es válido.';
            case 'auth/user-disabled':
                return 'Esta cuenta ha sido deshabilitada.';
            case 'auth/user-not-found':
                return 'No existe una cuenta con este correo electrónico.';
            case 'auth/wrong-password':
                return 'La contraseña es incorrecta.';
            case 'auth/invalid-credential':
                return 'Credenciales inválidas. Verifica tu correo y contraseña.';
            case 'auth/too-many-requests':
                return 'Demasiados intentos fallidos. Intenta más tarde.';
            default:
                return 'Error al iniciar sesión. Intenta nuevamente.';
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.includes('@')) {
            setError('Ingresa un email válido');
            return;
        }
        if (!password) {
            setError('Ingresa tu contraseña');
            return;
        }

        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            const code = err?.code || '';
            setError(getFirebaseErrorMessage(code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-white">
            {/* LEFT PANEL: Branding & Visuals (Hidden on mobile) */}
            <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative flex-col justify-center items-center p-12 overflow-hidden">
                {/* Abstract Background Grid */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                    <div className="white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 shadow-2xl">
                        <Shield className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
                            SPI <span className="opacity-80">Smart Flow</span>
                        </h1>
                        <p className="text-blue-200 text-lg font-medium max-w-xs mx-auto">
                            Gestión inteligente de Propiedad Intelectual
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {["Registro de Marcas", "Gestión Documental", "Firma Digital"].map((feat) => (
                            <span key={feat} className="bg-white/10 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm uppercase tracking-wider">
                                {feat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-8 text-blue-300/60 text-xs font-medium">
                    © 2025 SPI Smart Flow · Soluciones IP de Alto Nivel
                </div>
            </div>

            {/* RIGHT PANEL: Auth Form */}
            <div className="w-full md:w-[55%] bg-slate-50 flex items-center justify-center p-8 relative">
                <div className="w-full max-w-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-scale shadow-blue-500/5">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Bienvenido
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Ingresa tus credenciales para acceder al sistema
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-semibold ml-1">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="nombre@empresa.com" 
                                        className="h-11 pl-11 rounded-xl border-slate-200 bg-white focus-visible:ring-blue-600 focus-visible:border-blue-600"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-semibold ml-1">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="h-11 pl-11 rounded-xl border-slate-200 bg-white focus-visible:ring-blue-600 focus-visible:border-blue-600"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center animate-shake">{error}</p>}

                            <Button type="submit" className="w-full btn-primary h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...
                                    </>
                                ) : (
                                    <>
                                        Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                        
                        <div className="mt-12 text-center">
                            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                                © 2025 SPI Smart Flow · Acceso Seguro
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
