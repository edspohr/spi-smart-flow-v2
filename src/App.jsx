import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ClientDashboard from './pages/ClientDashboard';
import ClientAdminDashboard from './pages/ClientAdminDashboard';
import SPIDashboard from './pages/SPIDashboard';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes would go here, for now just simple routing */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/login" replace />} />
              <Route path="client" element={<ClientDashboard />} />
              <Route path="client-admin" element={<ClientAdminDashboard />} />
              <Route path="spi-admin" element={<SPIDashboard />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
