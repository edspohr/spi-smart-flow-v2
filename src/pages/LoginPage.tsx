import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { auth, db } from '../lib/firebase';
import {
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';

type Panel = 'login' | 'recovery' | 'register';

// ── Google "G" icon (inline SVG, no extra dependency) ────────────────────────

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// ── Left decorative panel ────────────────────────────────────────────────────

const LeftPanel = () => (
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
            <div className="flex flex-col items-center gap-3 mt-8">
                <span className="text-blue-200/70 text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Áreas de servicio
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                    {["Registro de Marcas", "Gestión Documental", "Firma Digital", "Asuntos regulatorios"].map((feat) => (
                        <span key={feat} className="bg-white/10 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm uppercase tracking-wider">
                            {feat}
                        </span>
                    ))}
                </div>
            </div>
        </div>
        <div className="absolute bottom-8 text-blue-300/60 text-xs font-medium">
            © 2026 SPI Smart Flow · Soluciones IP de Alto Nivel
        </div>
    </div>
);

// ── Login panel ──────────────────────────────────────────────────────────────

const LoginPanel = ({ onSwitch }: { onSwitch: (p: Panel) => void }) => {
    const { signIn, signInWithGoogle } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                setError('Correo o contraseña incorrectos.');
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

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
            // Successful login — auth state listener handles the redirect
        } catch (err: any) {
            setError(err?.message || 'Ocurrió un error al iniciar sesión con Google.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-scale shadow-blue-500/5">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
                <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para acceder.</p>
            </div>

            {/* Google Sign-In (primary) */}
            <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium gap-2 shadow-sm"
            >
                <GoogleIcon className="w-5 h-5" />
                Continuar con Google
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
                Recomendado para usuarios SPI
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">
                    o
                </span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center animate-shake">
                        {error}
                    </p>
                )}

                <Button type="submit" className="w-full btn-primary h-11 mt-2" disabled={isLoading}>
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</>
                    ) : (
                        <>Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2">
                <button
                    type="button"
                    onClick={() => onSwitch('recovery')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    ¿Olvidaste tu contraseña?
                </button>
                <button
                    type="button"
                    onClick={() => onSwitch('register')}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                    ¿No tienes cuenta? <span className="text-blue-600 font-semibold">Regístrate</span>
                </button>
            </div>

            <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                    © 2026 SPI Smart Flow · Acceso Seguro
                </p>
            </div>
        </div>
    );
};

// ── Password Recovery panel ──────────────────────────────────────────────────

const RecoveryPanel = ({ onSwitch }: { onSwitch: (p: Panel) => void }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/user-not-found') {
                setError('No existe una cuenta con ese correo electrónico.');
            } else if (code === 'auth/invalid-email') {
                setError('El formato del correo no es válido.');
            } else {
                setError('Ocurrió un error. Intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-scale shadow-blue-500/5">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recuperar contraseña</h2>
                <p className="text-slate-500 text-sm mt-1">Te enviaremos un enlace a tu correo.</p>
            </div>

            {sent ? (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 font-medium text-center">
                        Te enviamos un enlace de recuperación a <span className="font-bold">{email}</span>. Revisa tu bandeja de entrada.
                    </div>
                    <button
                        type="button"
                        onClick={() => onSwitch('login')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                    >
                        ← Volver al inicio de sesión
                    </button>
                </div>
            ) : (
                <form onSubmit={handleRecovery} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="recovery-email" className="text-slate-700 font-semibold ml-1">Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="recovery-email"
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
                        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full btn-primary h-11" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                            'Enviar enlace de recuperación'
                        )}
                    </Button>

                    <button
                        type="button"
                        onClick={() => onSwitch('login')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                    >
                        ← Volver al inicio de sesión
                    </button>
                </form>
            )}
        </div>
    );
};

// ── Self-Registration panel ──────────────────────────────────────────────────

const RegisterPanel = ({ onSwitch }: { onSwitch: (p: Panel) => void }) => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: fullName });
            await setDoc(doc(db, 'users', credential.user.uid), {
                name: fullName,
                email,
                role: 'guest',
                companyId: null,
                createdAt: serverTimestamp(),
            });
            navigate('/pendiente');
        } catch (err: any) {
            const code = err?.code || '';
            if (code === 'auth/email-already-in-use') {
                setError('Ya existe una cuenta con este correo electrónico.');
            } else if (code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 8 caracteres.');
            } else {
                setError('Error al crear la cuenta. Intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-fade-scale shadow-blue-500/5">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Crear cuenta</h2>
                <p className="text-slate-500 text-sm mt-1">Tu acceso será activado por el equipo SPI.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="reg-name" className="text-slate-700 font-semibold ml-1">Nombre completo</Label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            id="reg-name"
                            type="text"
                            placeholder="Nombre y apellido"
                            className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="reg-email" className="text-slate-700 font-semibold ml-1">Correo electrónico</Label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            id="reg-email"
                            type="email"
                            placeholder="nombre@empresa.com"
                            className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="reg-password" className="text-slate-700 font-semibold ml-1">Contraseña</Label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            id="reg-password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="reg-confirm" className="text-slate-700 font-semibold ml-1">Confirmar contraseña</Label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            id="reg-confirm"
                            type="password"
                            placeholder="Repite tu contraseña"
                            className="h-10 pl-10 rounded-xl border-slate-200 bg-white"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center">
                        {error}
                    </p>
                )}

                <Button type="submit" className="w-full btn-primary h-11" disabled={isLoading}>
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
                    ) : (
                        'Crear cuenta'
                    )}
                </Button>

                <button
                    type="button"
                    onClick={() => onSwitch('login')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                >
                    ← Volver al inicio de sesión
                </button>
            </form>
        </div>
    );
};

// ── Root LoginPage ────────────────────────────────────────────────────────────

const LoginPage = () => {
    const { user, loading } = useAuthStore();
    const navigate = useNavigate();
    const [panel, setPanel] = useState<Panel>('login');

    useEffect(() => {
        if (user && !loading) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client') navigate('/client');
            else navigate('/pendiente');
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-white">
            <LeftPanel />

            <div className="w-full md:w-[55%] bg-slate-50 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    {panel === 'login'    && <LoginPanel    onSwitch={setPanel} />}
                    {panel === 'recovery' && <RecoveryPanel onSwitch={setPanel} />}
                    {panel === 'register' && <RegisterPanel onSwitch={setPanel} />}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
