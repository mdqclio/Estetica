import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Cliente } from '../types';
import { clientesService } from '../services/clientes.service';
import { useAuth } from '../hooks/useAuth';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col border-b py-3 sm:flex-row sm:items-center">
      <span className="w-48 text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}

export function ClienteDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const podeEditar = hasRole('ADMIN', 'RECEPCIONISTA');

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    clientesService
      .get(id)
      .then(setCliente)
      .catch(() => setError('No se pudo cargar el cliente.'));
  }, [id]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!cliente) {
    return <p className="text-gray-400">Cargando…</p>;
  }

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES') : '—';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/clientes" className="text-sm text-gray-500 hover:underline">
          ← Volver
        </Link>
        {podeEditar && (
          <Link
            to={`/clientes/${cliente.id}/editar`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Editar
          </Link>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{cliente.nome}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              cliente.ativo
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {cliente.ativo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <Row label="CPF" value={cliente.cpf} />
        <Row label="Teléfono" value={cliente.telefone} />
        <Row label="Email" value={cliente.email} />
        <Row label="Nacimiento" value={fmt(cliente.dataNascimento)} />
        <Row label="Dirección" value={cliente.endereco} />
        <Row label="Observaciones" value={cliente.observacoes} />
        <Row label="Registrado" value={fmt(cliente.createdAt)} />
      </div>
    </div>
  );
}
