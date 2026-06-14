import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireRole } from './components/RequireRole';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ClientesList } from './pages/ClientesList';
import { ClienteForm } from './pages/ClienteForm';
import { ClienteDetail } from './pages/ClienteDetail';
import { UsuariosList } from './pages/UsuariosList';
import { UsuarioForm } from './pages/UsuarioForm';
import { ServicosList } from './pages/ServicosList';
import { ServicoForm } from './pages/ServicoForm';
import { AgendamentosList } from './pages/AgendamentosList';
import { AgendamentoForm } from './pages/AgendamentoForm';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/clientes" element={<ClientesList />} />
            {/* Alta/edición de clientes: PROFISSIONAL es solo lectura */}
            <Route
              path="/clientes/nuevo"
              element={
                <RequireRole roles={['ADMIN', 'RECEPCIONISTA']}>
                  <ClienteForm />
                </RequireRole>
              }
            />
            <Route path="/clientes/:id" element={<ClienteDetail />} />
            <Route
              path="/clientes/:id/editar"
              element={
                <RequireRole roles={['ADMIN', 'RECEPCIONISTA']}>
                  <ClienteForm />
                </RequireRole>
              }
            />

            {/* Servicios: lectura para todos; alta/edición solo ADMIN */}
            <Route path="/servicos" element={<ServicosList />} />
            <Route
              path="/servicos/nuevo"
              element={
                <RequireRole roles={['ADMIN']}>
                  <ServicoForm />
                </RequireRole>
              }
            />
            <Route
              path="/servicos/:id/editar"
              element={
                <RequireRole roles={['ADMIN']}>
                  <ServicoForm />
                </RequireRole>
              }
            />

            {/* Turnos: lectura para todos (PROFISSIONAL solo su agenda, filtrado
                en backend); alta/edición solo ADMIN y RECEPCIONISTA */}
            <Route path="/agendamentos" element={<AgendamentosList />} />
            <Route
              path="/agendamentos/nuevo"
              element={
                <RequireRole roles={['ADMIN', 'RECEPCIONISTA']}>
                  <AgendamentoForm />
                </RequireRole>
              }
            />
            <Route
              path="/agendamentos/:id/editar"
              element={
                <RequireRole roles={['ADMIN', 'RECEPCIONISTA']}>
                  <AgendamentoForm />
                </RequireRole>
              }
            />

            {/* Gestión de usuarios: solo ADMIN */}
            <Route
              path="/usuarios"
              element={
                <RequireRole roles={['ADMIN']}>
                  <UsuariosList />
                </RequireRole>
              }
            />
            <Route
              path="/usuarios/nuevo"
              element={
                <RequireRole roles={['ADMIN']}>
                  <UsuarioForm />
                </RequireRole>
              }
            />
            <Route
              path="/usuarios/:id/editar"
              element={
                <RequireRole roles={['ADMIN']}>
                  <UsuarioForm />
                </RequireRole>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/clientes" replace />} />
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
