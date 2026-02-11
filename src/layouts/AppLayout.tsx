import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Sidebar from './Sidebar';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const AppLayout = () => {
    const { user, loading, logout } = useAuthStore();

    if (loading) {
        return (
             <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
             </div>
        );
    }

    if (!user) {
        // Redirect to login if strictly enforcing protection here, 
        // but often better to handle in router. 
        // For now, let's assume router catches this or we redirect.
        // return <Navigate to="/login" replace />;
        // *However*, we don't have a login page yet, so we render a dev placeholder if user is null.
        return <div className="p-10">User not authenticated. Please use the Dev Login.</div>; 
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Sidebar />
            
            <div className="sm:ml-64">
                {/* Glass Header */}
                <header className="glass-header flex h-16 items-center justify-between px-6">
                    <h1 className="text-lg font-semibold text-slate-700">
                        {/* Dynamic Title based on route could go here */}
                        Portal {user.role === 'spi-admin' ? 'Administrador' : 'Clientes'}
                    </h1>

                    <div className="flex items-center gap-4">
                         <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-blue-600">
                             <Bell className="h-5 w-5" />
                             <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
                         </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatars/01.png" alt={user.displayName || "User"} />
                                        <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase() || "US"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="container mx-auto p-6 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
