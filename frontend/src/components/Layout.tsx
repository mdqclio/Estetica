import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar móvil */}
        <header className="flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <span className="font-semibold text-brand-700">Estética</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
