import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientVault from './pages/ClientVault';
import NewRequestPage from './pages/NewRequestPage';
import GuestDashboard from './pages/GuestDashboard';
import ClientAdminDashboard from './pages/ClientAdminDashboard';
import SPIAdminDashboard from './pages/SPIAdminDashboard';


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route element={<AppLayout />}>
            
            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['client', 'client-admin']} />}>
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/client/vault" element={<ClientVault />} />
                <Route path="/client/nueva-solicitud" element={<NewRequestPage />} />
            </Route>

            {/* Guest Route */}
            <Route element={<ProtectedRoute allowedRoles={['guest']} />}>
                <Route path="/guest" element={<GuestDashboard />} />
            </Route>

            {/* Client Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['client-admin']} />}>
                <Route path="/client-admin" element={<ClientAdminDashboard />} />
            </Route>

            {/* SPI Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['spi-admin']} />}>
                <Route path="/spi-admin" element={<SPIAdminDashboard />} />
            </Route>

        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
