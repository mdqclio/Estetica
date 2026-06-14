import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ClienteInput } from '../types';
import { clientesService } from '../services/clientes.service';

const empty: ClienteInput = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  dataNascimento: '',
  endereco: '',
  observacoes: '',
};

export function ClienteForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ClienteInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    clientesService
      .get(id)
      .then((c) =>
        setForm({
          nome: c.nome,
          cpf: c.cpf,
          telefone: c.telefone || '',
          email: c.email || '',
          dataNascimento: c.dataNascimento
            ? c.dataNascimento.substring(0, 10)
            : '',
          endereco: c.endereco || '',
          observacoes: c.observacoes || '',
        }),
      )
      .catch(() => setServerError('Não foi possível carregar o cliente.'));
  }, [id]);

  function set<K extends keyof ClienteInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'O nome é obrigatório.';
    if (!/^\d{11}$/.test(form.cpf)) e.cpf = 'O CPF deve ter 11 dígitos.';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = 'E-mail inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      if (editing && id) {
        await clientesService.update(id, form);
      } else {
        await clientesService.create(form);
      }
      navigate('/clientes');
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || 'Não foi possível salvar o cliente.',
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
        {editing ? 'Editar cliente' : 'Novo cliente'}
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
            Nome *
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              CPF * (11 dígitos)
            </label>
            <input
              className={field}
              value={form.cpf}
              maxLength={11}
              onChange={(e) => set('cpf', e.target.value.replace(/\D/g, ''))}
            />
            {errors.cpf && (
              <p className="mt-1 text-xs text-red-600">{errors.cpf}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              className={field}
              value={form.telefone}
              onChange={(e) => set('telefone', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              className={field}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data de nascimento
            </label>
            <input
              type="date"
              className={field}
              value={form.dataNascimento}
              onChange={(e) => set('dataNascimento', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Endereço
          </label>
          <input
            className={field}
            value={form.endereco}
            onChange={(e) => set('endereco', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Observações
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
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
          <Link
            to="/clientes"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
