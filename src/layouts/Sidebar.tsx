import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Files, 
  Settings, 
  Users, 
  ShieldCheck, 
  BarChart, 
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'client':
        return [
          { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/client/vault', label: 'Bóveda Smart', icon: ShieldCheck },
          { href: '/client/profile', label: 'Mi Perfil', icon: Users },
        ];
      case 'client-admin':
        return [
          { href: '/client-admin', label: 'Resumen Empresa', icon: BarChart },
          { href: '/client-admin/team', label: 'Equipo', icon: Users },
          { href: '/client-admin/billing', label: 'Facturación', icon: FileText },
        ];
      case 'spi-admin':
        return [
          { href: '/spi-admin', label: 'Torre de Control', icon: LayoutDashboard },
          { href: '/spi-admin/companies', label: 'Empresas', icon: Files },
          { href: '/spi-admin/settings', label: 'Configuración', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200/50 bg-white/70 backdrop-blur-xl transition-transform">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-8 flex items-center pl-2.5">
          <span className="self-center whitespace-nowrap text-xl font-bold text-slate-800">
            SPI <span className="text-blue-600">Smart Flow</span>
          </span>
        </div>
        <ul className="space-y-2 font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <li key={link.href}>
                <Link to={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto px-3 py-4">
           {/* Bottom usage indicator or simpler user info if needed */}
           <div className="rounded-lg bg-blue-50/50 p-4 text-xs text-blue-800">
              <p className="font-semibold">Estado: {user.role.toUpperCase()}</p>
              <p className="mt-1 opacity-75">{user.email}</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
