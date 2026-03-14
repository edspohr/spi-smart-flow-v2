import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { isAdminEmail } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Login states
type LoginStep = 'email' | 'password' | 'magic_sent';

const LoginPage = () => {
    const { user, signIn, sendMagicLink, completeMagicLinkSignIn } = useAuthStore();
    const navigate = useNavigate();

    const [step, setStep] = useState<LoginStep>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle magic link callback on page load
    useEffect(() => {
        const handleCallback = async () => {
            try {
                await completeMagicLinkSignIn();
            } catch {
                setError('El enlace de acceso es inválido o ha expirado. Solicita uno nuevo.');
                setStep('email');
            }
        };
        handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Redirect once authenticated
    useEffect(() => {
        if (user && !isLoading) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client') navigate('/client');
            else navigate('/guest');
        }
    }, [user, navigate, isLoading]);

    // Step 1 — email submitted: route to password or magic link
    const handleEmailContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.includes('@')) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        if (isAdminEmail(email)) {
            setStep('password');
        } else {
            setIsLoading(true);
            try {
                await sendMagicLink(email);
                setStep('magic_sent');
            } catch (err: any) {
                const code = err?.code || '';
                if (code === 'auth/invalid-email') setError('El correo electrónico no es válido.');
                else if (code === 'auth/too-many-requests') setError('Demasiados intentos. Intenta más tarde.');
                else setError('No se pudo enviar el enlace. Intenta nuevamente.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Step 2a — password login (admin)
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Ingresa tu contraseña.');
            return;
        }

        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                setError('Contraseña incorrecta. Verifica tus credenciales.');
            } else if (code === 'auth/user-disabled') {
                setError('Esta cuenta ha sido deshabilitada.');
            } else if (code === 'auth/too-many-requests') {
                setError('Demasiados intentos fallidos. Intenta más tarde.');
            } else {
                setError('Ocurrió un error. Intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetToEmail = () => {
        setStep('email');
        setPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-white">
            {/* LEFT PANEL */}
            <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative flex-col justify-center items-center p-12 overflow-hidden">
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
                    <div className="p-4 drop-shadow-2xl">
                        <img src="/spi-logo.png" alt="SPI Americas" className="h-20 w-auto object-contain drop-shadow-lg rounded-xl" />
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
                    © 2026 SPI Smart Flow · Soluciones IP de Alto Nivel
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full md:w-[55%] bg-slate-50 flex items-center justify-center p-8 relative">
                <div className="w-full max-w-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-scale shadow-blue-500/5">

                        {/* ── STEP 1: Email ─────────────────────────────── */}
                        {step === 'email' && (
                            <>
                                <div className="mb-8 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Ingresa tu correo electrónico para continuar.
                                    </p>
                                </div>
                                <form onSubmit={handleEmailContinue} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-slate-700 font-semibold ml-1">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="nombre@empresa.com"
                                                className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center animate-shake">
                                            {error}
                                        </p>
                                    )}
                                    <Button type="submit" className="w-full btn-primary h-11 mt-4" disabled={isLoading}>
                                        {isLoading ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                                        ) : (
                                            <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* ── STEP 2a: Password (admin) ──────────────────── */}
                        {step === 'password' && (
                            <>
                                <div className="mb-8">
                                    <button
                                        onClick={resetToEmail}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mb-5"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" /> Cambiar correo
                                    </button>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso interno</h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Equipo SPI · <span className="font-medium text-slate-700">{email}</span>
                                    </p>
                                </div>
                                <form onSubmit={handlePasswordLogin} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-slate-700 font-semibold ml-1">Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center animate-shake">
                                            {error}
                                        </p>
                                    )}
                                    <Button type="submit" className="w-full btn-primary h-11 mt-4" disabled={isLoading}>
                                        {isLoading ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</>
                                        ) : (
                                            <>Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* ── STEP 2b: Magic link sent (client) ─────────── */}
                        {step === 'magic_sent' && (
                            <div className="text-center py-4 space-y-5">
                                <div className="flex justify-center">
                                    <div className="bg-blue-50 rounded-full p-4">
                                        <MailCheck className="h-10 w-10 text-blue-600" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Revisa tu bandeja</h2>
                                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                                        Enviamos un enlace de acceso a<br />
                                        <span className="font-semibold text-slate-700">{email}</span>
                                    </p>
                                    <p className="text-slate-400 text-xs mt-3">
                                        El enlace expira en 1 hora. Revisa también tu carpeta de spam.
                                    </p>
                                </div>
                                {error && (
                                    <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg animate-shake">
                                        {error}
                                    </p>
                                )}
                                <button
                                    onClick={resetToEmail}
                                    className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" /> Usar otro correo
                                </button>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                                © 2026 SPI Smart Flow · Acceso Seguro
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
