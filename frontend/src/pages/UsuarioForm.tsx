import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Perfil, UsuarioInput } from '../types';
import { usuariosService } from '../services/usuarios.service';

const PERFILES: Perfil[] = ['ADMIN', 'RECEPCIONISTA', 'PROFISSIONAL'];

const empty: UsuarioInput = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'RECEPCIONISTA',
  ativo: true,
};

export function UsuarioForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<UsuarioInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    usuariosService
      .get(id)
      .then((u) =>
        setForm({
          nome: u.nome,
          email: u.email,
          senha: '',
          perfil: u.perfil,
          ativo: u.ativo,
        }),
      )
      .catch(() => setServerError('No se pudo cargar el usuario.'));
  }, [id]);

  function set<K extends keyof UsuarioInput>(key: K, value: UsuarioInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'El nombre es obligatorio.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = 'Email inválido.';
    // En alta la contraseña es obligatoria; al editar, en blanco = no cambiar.
    if (!editing && (!form.senha || form.senha.length < 6))
      e.senha = 'La contraseña debe tener al menos 6 caracteres.';
    if (editing && form.senha && form.senha.length < 6)
      e.senha = 'La contraseña debe tener al menos 6 caracteres.';
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
        await usuariosService.update(id, form);
      } else {
        await usuariosService.create(form);
      }
      navigate('/usuarios');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setServerError(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || 'No se pudo guardar el usuario.',
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
        {editing ? 'Editar usuario' : 'Nuevo usuario'}
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
            Email *
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {editing ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
            </label>
            <input
              type="password"
              className={field}
              value={form.senha}
              onChange={(e) => set('senha', e.target.value)}
            />
            {errors.senha && (
              <p className="mt-1 text-xs text-red-600">{errors.senha}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Perfil *
            </label>
            <select
              className={field}
              value={form.perfil}
              onChange={(e) => set('perfil', e.target.value as Perfil)}
            >
              {PERFILES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {editing && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.ativo ?? true}
              onChange={(e) => set('ativo', e.target.checked)}
            />
            Activo
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
          <Link
            to="/usuarios"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
