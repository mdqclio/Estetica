import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AgendamentoInput,
  Cliente,
  Paginated,
  ProfissionalRef,
  Servico,
} from '../types';
import { agendamentosService } from '../services/agendamentos.service';
import { clientesService } from '../services/clientes.service';
import { servicosService } from '../services/servicos.service';
import { usuariosService } from '../services/usuarios.service';

interface FormState {
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  dataHoraInicio: string; // valor de datetime-local (hora local)
  observacoes: string;
}

const empty: FormState = {
  clienteId: '',
  servicoId: '',
  profissionalId: '',
  dataHoraInicio: '',
  observacoes: '',
};

// ISO (UTC) -> valor para <input type="datetime-local"> (hora local)
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AgendamentoForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(empty);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalRef[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar opciones de los selects
  useEffect(() => {
    clientesService
      .list({ limit: 100, ativo: 'true' })
      .then((r: Paginated<Cliente>) => setClientes(r.data))
      .catch(() => setClientes([]));
    servicosService
      .list({ limit: 100, ativo: 'true' })
      .then((r: Paginated<Servico>) => setServicos(r.data))
      .catch(() => setServicos([]));
    usuariosService
      .profissionais()
      .then(setProfissionais)
      .catch(() => setProfissionais([]));
  }, []);

  // Cargar turno al editar
  useEffect(() => {
    if (!id) return;
    agendamentosService
      .get(id)
      .then((a) =>
        setForm({
          clienteId: a.clienteId,
          servicoId: a.servicoId,
          profissionalId: a.profissionalId,
          dataHoraInicio: isoToLocalInput(a.dataHoraInicio),
          observacoes: a.observacoes || '',
        }),
      )
      .catch(() => setServerError('No se pudo cargar el turno.'));
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Fin calculado según la duración del servicio seleccionado
  const fimCalculado = useMemo(() => {
    const servico = servicos.find((s) => s.id === form.servicoId);
    if (!servico || !form.dataHoraInicio) return null;
    const inicio = new Date(form.dataHoraInicio);
    if (Number.isNaN(inicio.getTime())) return null;
    const fim = new Date(inicio.getTime() + servico.duracaoMinutos * 60_000);
    return fim.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [servicos, form.servicoId, form.dataHoraInicio]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.clienteId) e.clienteId = 'Selecciona un cliente.';
    if (!form.servicoId) e.servicoId = 'Selecciona un servicio.';
    if (!form.profissionalId) e.profissionalId = 'Selecciona un profesional.';
    if (!form.dataHoraInicio) e.dataHoraInicio = 'Indica fecha y hora.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    // El backend calcula dataHoraFim según la duración del servicio.
    const payload: AgendamentoInput = {
      clienteId: form.clienteId,
      servicoId: form.servicoId,
      profissionalId: form.profissionalId,
      dataHoraInicio: new Date(form.dataHoraInicio).toISOString(),
      observacoes: form.observacoes,
    };

    setLoading(true);
    try {
      if (editing && id) {
        await agendamentosService.update(id, payload);
      } else {
        await agendamentosService.create(payload);
      }
      navigate('/agendamentos');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setServerError(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || 'No se pudo guardar el turno.',
      );
    } finally {
      setLoading(false);
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        {editing ? 'Editar turno' : 'Nuevo turno'}
      </h1>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cliente *
          </label>
          <select
            className={field}
            value={form.clienteId}
            onChange={(e) => set('clienteId', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {errors.clienteId && (
            <p className="mt-1 text-xs text-red-600">{errors.clienteId}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Servicio *
          </label>
          <select
            className={field}
            value={form.servicoId}
            onChange={(e) => set('servicoId', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.duracaoMinutos} min)
              </option>
            ))}
          </select>
          {errors.servicoId && (
            <p className="mt-1 text-xs text-red-600">{errors.servicoId}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Profesional *
          </label>
          <select
            className={field}
            value={form.profissionalId}
            onChange={(e) => set('profissionalId', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {errors.profissionalId && (
            <p className="mt-1 text-xs text-red-600">{errors.profissionalId}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fecha y hora de inicio *
          </label>
          <input
            type="datetime-local"
            className={field}
            value={form.dataHoraInicio}
            onChange={(e) => set('dataHoraInicio', e.target.value)}
          />
          {errors.dataHoraInicio && (
            <p className="mt-1 text-xs text-red-600">{errors.dataHoraInicio}</p>
          )}
          {fimCalculado && (
            <p className="mt-1 text-xs text-gray-500">
              Fin estimado: {fimCalculado} (según duración del servicio)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Observaciones
          </label>
          <textarea
            className={field}
            rows={3}
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
          <Link
            to="/agendamentos"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
