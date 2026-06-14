import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
}

const linkBase =
  'block rounded-lg px-4 py-2 text-sm font-medium transition-colors';

export function Sidebar({ open, onClose }: Props) {
  const { user, logout, hasRole } = useAuth();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
    }`;

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-30 flex h-full w-64 flex-col bg-white shadow-lg transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b px-6 py-5">
          <h1 className="text-lg font-bold text-brand-700">💅 Estética</h1>
          <p className="mt-1 text-xs text-gray-500">Panel de gestión</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" onClick={onClose}>
          <NavLink to="/clientes" className={navClass}>
            Clientes
          </NavLink>
          <NavLink to="/servicos" className={navClass}>
            Servicios
          </NavLink>
          <NavLink to="/agendamentos" className={navClass}>
            Turnos
          </NavLink>
          {hasRole('ADMIN') && (
            <NavLink to="/usuarios" className={navClass}>
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="border-t px-4 py-4">
          <div className="mb-2">
            <p className="truncate text-sm font-medium text-gray-800">
              {user?.nome}
            </p>
            <p className="text-xs text-gray-500">{user?.perfil}</p>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
