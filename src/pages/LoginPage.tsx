import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { UserRole } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
    const { user, devLogin } = useAuthStore();
    const navigate = useNavigate();

    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client-admin') navigate('/client-admin');
            else navigate('/client');
        }
    }, [user, navigate]);

    // Handle OTP auto-trigger
    useEffect(() => {
        if (step === 'code' && otp.every(v => v !== '') && otp.join('').length === 6) {
            const finalCode = otp.join('');
            autoVerify(finalCode);
        }
    }, [otp, step]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email.includes('@')) {
            setError('Ingresa un email válido');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep('code');
        }, 1200);
    };

    const autoVerify = async (finalCode: string) => {
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            if (finalCode === '123456') {
                let role: UserRole = 'client';
                if (email.includes('admin') || email.includes('spi')) role = 'spi-admin';
                else if (email.includes('manager') || email.includes('jefe')) role = 'client-admin';
                devLogin(role);
            } else {
                setError('Código incorrecto. Intenta con 123456');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        }, 1200);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
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
                        {["IA Integrada", "Bóveda Documental", "Firma Digital"].map((feat) => (
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
                                {step === 'email' ? 'Bienvenido' : 'Verifica tu acceso'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {step === 'email' 
                                    ? 'Ingresa tu correo para comenzar la sesión' 
                                    : `Ingresa el código enviado a ${email}`}
                            </p>
                        </div>

                        {step === 'email' ? (
                            <form onSubmit={handleSendCode} className="space-y-5">
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
                                
                                {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center animate-shake">{error}</p>}

                                <Button type="submit" className="w-full btn-primary h-11" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-4">Accesos rápidos Demo</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {[
                                            { label: 'Admin', email: 'admin@spi.cl' },
                                            { label: 'Gerente', email: 'manager@demo.com' },
                                            { label: 'Cliente', email: 'usuario@demo.com' }
                                        ].map((demo) => (
                                            <button 
                                                key={demo.label}
                                                type="button" 
                                                onClick={() => setEmail(demo.email)} 
                                                className="text-slate-400 hover:text-blue-600 underline underline-offset-4 text-xs font-medium transition-colors"
                                            >
                                                {demo.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between gap-2">
                                    {otp.map((val, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { inputRefs.current[i] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={val}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-10 h-12 text-center text-xl font-mono font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all bg-white text-slate-900"
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>

                                {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg text-center">{error}</p>}
                                
                                <p className="text-xs text-slate-400 text-center">
                                    Usa el código <strong className="text-slate-900">123456</strong> para validar la demo
                                </p>

                                <div className="flex flex-col gap-3">
                                    <Button 
                                        onClick={() => autoVerify(otp.join(''))} 
                                        className="w-full btn-primary h-11" 
                                        disabled={isLoading || otp.join('').length < 6}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                                            </>
                                        ) : (
                                            <>
                                                Verificar Código <CheckCircle className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                    
                                    <button 
                                        type="button" 
                                        className="text-slate-400 hover:text-slate-900 text-xs font-medium transition-colors py-2" 
                                        onClick={() => { setStep('email'); setOtp(['','','','','','']); setError(''); }}
                                    >
                                        Volver a ingresar correo
                                    </button>
                                </div>
                            </div>
                        )}
                        
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
