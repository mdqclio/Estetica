import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ServicoInput } from '../types';
import { servicosService } from '../services/servicos.service';

interface FormState {
  nome: string;
  descricao: string;
  duracaoMinutos: string;
  preco: string;
}

const empty: FormState = {
  nome: '',
  descricao: '',
  duracaoMinutos: '',
  preco: '',
};

export function ServicoForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    servicosService
      .get(id)
      .then((s) =>
        setForm({
          nome: s.nome,
          descricao: s.descricao || '',
          duracaoMinutos: String(s.duracaoMinutos),
          preco: String(Number(s.preco)),
        }),
      )
      .catch(() => setServerError('No se pudo cargar el servicio.'));
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'El nombre es obligatorio.';
    const dur = Number(form.duracaoMinutos);
    if (!Number.isInteger(dur) || dur < 1)
      e.duracaoMinutos = 'Duración inválida (mínimo 1 minuto).';
    const preco = Number(form.preco);
    if (Number.isNaN(preco) || preco < 0)
      e.preco = 'Precio inválido (no negativo).';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload: ServicoInput = {
      nome: form.nome.trim(),
      descricao: form.descricao,
      duracaoMinutos: Number(form.duracaoMinutos),
      preco: Number(form.preco),
    };

    setLoading(true);
    try {
      if (editing && id) {
        await servicosService.update(id, payload);
      } else {
        await servicosService.create(payload);
      }
      navigate('/servicos');
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || 'No se pudo guardar el servicio.',
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
        {editing ? 'Editar servicio' : 'Nuevo servicio'}
      </h1>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {Array.isArray(serverError) ? serverError.join(', ') : serverError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input
            className={field}
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
          />
          {errors.nome && (
            <p className="mt-1 text-xs text-red-600">{errors.nome}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            className={field}
            rows={3}
            value={form.descricao}
            onChange={(e) => set('descricao', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Duración (minutos) *
            </label>
            <input
              type="number"
              min={1}
              className={field}
              value={form.duracaoMinutos}
              onChange={(e) => set('duracaoMinutos', e.target.value)}
            />
            {errors.duracaoMinutos && (
              <p className="mt-1 text-xs text-red-600">
                {errors.duracaoMinutos}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Precio (R$) *
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={field}
              value={form.preco}
              onChange={(e) => set('preco', e.target.value)}
            />
            {errors.preco && (
              <p className="mt-1 text-xs text-red-600">{errors.preco}</p>
            )}
          </div>
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
            to="/servicos"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
