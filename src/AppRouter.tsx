import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientVault from './pages/ClientVault';
import GuestDashboard from './pages/GuestDashboard';
import SPIAdminDashboard from './pages/SPIAdminDashboard';
import SPIVault from './pages/SPIVault';
import CompaniesPage from './pages/CompaniesPage';
import PICompletionPage from './pages/PICompletionPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracionSolicitudesPage from './pages/ConfiguracionSolicitudesPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PendientePage from './pages/PendientePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Pending activation — any authenticated user */}
        <Route path="/pendiente" element={<PendientePage />} />

        {/* Protected Routes */}
        <Route element={<AppLayout />}>

          {/* Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/vault" element={<ClientVault />} />
            <Route path="/client/ot/:otId/completar" element={<PICompletionPage />} />
          </Route>

          {/* Guest Route — kept for backward compat but redirects to /pendiente */}
          <Route element={<ProtectedRoute allowedRoles={['guest']} />}>
            <Route path="/guest" element={<GuestDashboard />} />
          </Route>

          {/* SPI Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['spi-admin']} />}>
            <Route path="/spi-admin" element={<SPIAdminDashboard />} />
            <Route path="/spi-admin/usuarios" element={<UsuariosPage />} />
            <Route path="/spi-admin/vault" element={<SPIVault />} />
            <Route path="/spi-admin/companies" element={<CompaniesPage />} />
            <Route path="/spi-admin/configuracion-solicitudes" element={<ConfiguracionSolicitudesPage />} />
          </Route>

        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
