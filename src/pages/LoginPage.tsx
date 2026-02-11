import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { UserRole } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Briefcase } from 'lucide-react';

const LoginPage = () => {
    const { user, devLogin } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client-admin') navigate('/client-admin');
            else navigate('/client');
        }
    }, [user, navigate]);

    const handleLogin = (role: UserRole) => {
        devLogin(role);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-slate-800">SPI Smart Flow V2</CardTitle>
                    <CardDescription>Selecciona un perfil para ingresar (Modo Dev)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button 
                        variant="outline" 
                        className="w-full h-16 justify-start gap-4 text-lg hover:bg-blue-50 hover:border-blue-200"
                        onClick={() => handleLogin('client')}
                    >
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-700">Cliente</p>
                            <p className="text-xs text-slate-500">Acceso a solicitudes y bóveda</p>
                        </div>
                    </Button>

                    <Button 
                        variant="outline" 
                        className="w-full h-16 justify-start gap-4 text-lg hover:bg-purple-50 hover:border-purple-200"
                        onClick={() => handleLogin('client-admin')}
                    >
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                             <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-700">Admin Cliente</p>
                            <p className="text-xs text-slate-500">KPIs y gestión de equipo</p>
                        </div>
                    </Button>

                    <Button 
                        variant="outline" 
                        className="w-full h-16 justify-start gap-4 text-lg hover:bg-slate-100 hover:border-slate-300"
                        onClick={() => handleLogin('spi-admin')}
                    >
                        <div className="p-2 bg-slate-200 rounded-full text-slate-700">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-700">SPI Admin</p>
                            <p className="text-xs text-slate-500">Torre de control global</p>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
