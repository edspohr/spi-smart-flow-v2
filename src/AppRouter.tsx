import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ClientErrorBoundary from './components/ClientErrorBoundary';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import PageLoader from './components/PageLoader';
import LoginPage from './pages/LoginPage';
import ClientInboxPage from './pages/ClientInboxPage';
import ClientOTsPage from './pages/ClientOTsPage';
import ClientVault from './pages/ClientVault';
import GuestDashboard from './pages/GuestDashboard';
import PICompletionPage from './pages/PICompletionPage';
import OTCompletionPage from './pages/OTCompletionPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PendientePage from './pages/PendientePage';

// Admin routes — lazy-loaded so client bundle stays small.
const SPIAdminDashboard           = lazy(() => import('./pages/SPIAdminDashboard'));
const TorreDeControlPage          = lazy(() => import('./pages/TorreDeControlPage'));
const SPIVault                    = lazy(() => import('./pages/SPIVault'));
const CompaniesPage               = lazy(() => import('./pages/CompaniesPage'));
const UsuariosPage                = lazy(() => import('./pages/UsuariosPage'));
const ConfiguracionSolicitudesPage = lazy(() => import('./pages/ConfiguracionSolicitudesPage'));
const TasasCambioPage             = lazy(() => import('./pages/TasasCambioPage'));

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
            <Route path="/client" element={<ClientErrorBoundary><ClientInboxPage /></ClientErrorBoundary>} />
            <Route path="/client/ots" element={<ClientErrorBoundary><ClientOTsPage /></ClientErrorBoundary>} />
            <Route path="/client/vault" element={<ClientErrorBoundary><ClientVault /></ClientErrorBoundary>} />
            <Route path="/client/ot/:otId/completar" element={<ClientErrorBoundary><PICompletionPage /></ClientErrorBoundary>} />
            <Route path="/client/ot/:otId/completar-v2" element={<ClientErrorBoundary><OTCompletionPage /></ClientErrorBoundary>} />
          </Route>

          {/* Guest Route — kept for backward compat but redirects to /pendiente */}
          <Route element={<ProtectedRoute allowedRoles={['guest']} />}>
            <Route path="/guest" element={<GuestDashboard />} />
          </Route>

          {/* SPI Admin Routes — lazy-loaded + error-bounded */}
          <Route element={<ProtectedRoute allowedRoles={['spi-admin']} />}>
            <Route
              path="/spi-admin"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <SPIAdminDashboard />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/torre-de-control"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <TorreDeControlPage />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/usuarios"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <UsuariosPage />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/vault"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <SPIVault />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/companies"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <CompaniesPage />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/configuracion-solicitudes"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <ConfiguracionSolicitudesPage />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
            <Route
              path="/spi-admin/tasas-cambio"
              element={
                <AdminErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <TasasCambioPage />
                  </Suspense>
                </AdminErrorBoundary>
              }
            />
          </Route>

        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
