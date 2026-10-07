import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CitizenPortal from './pages/CitizenPortal';
import GovernmentPortal from './pages/GovernmentPortal';
import EGovernance from './pages/EGovernance';
import WaterElectricity from './pages/WaterElectricity';
import PublicTransport from './pages/PublicTransport';
import EmergencyServices from './pages/EmergencyServices';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <NotificationProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/citizen" element={<ProtectedRoute><CitizenPortal /></ProtectedRoute>} />
                <Route path="/government" element={<ProtectedRoute adminOnly><GovernmentPortal /></ProtectedRoute>} />
                <Route path="/egov" element={<ProtectedRoute><EGovernance /></ProtectedRoute>} />
                <Route path="/utilities" element={<ProtectedRoute><WaterElectricity /></ProtectedRoute>} />
                <Route path="/transport" element={<ProtectedRoute><PublicTransport /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute><EmergencyServices /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </NotificationProvider>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

