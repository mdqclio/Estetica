import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Perfil } from '../types';

// Restringe una ruta a ciertos perfiles. Si el usuario no tiene el rol,
// lo redirige a /clientes (la app ya exige estar autenticado vía ProtectedRoute).
export function RequireRole({
  roles,
  children,
}: {
  roles: Perfil[];
  children: ReactNode;
}) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to="/clientes" replace />;
  }
  return <>{children}</>;
}
