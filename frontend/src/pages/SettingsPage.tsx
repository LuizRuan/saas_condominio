import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, Mail, Settings, ShieldCheck, Trash2, UserCog, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import api from '../services/api';
import Button from '../components/ui/Button';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const CARGO_LABELS: Record<string, string> = {
  concierge: 'Porteiro',
  financial: 'Financeiro',
  subadmin: 'Gestão',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const ALLOWED_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'outlook.com', 'hotmail.com',
  'yahoo.com', 'yahoo.com.br', 'live.com', 'msn.com',
  'proton.me', 'protonmail.com',
]);

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDemo, blockAction } = useDemo();
  const navigate = useNavigate();
  const isPureAdmin = user?.role === 'admin';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState('');
  const [inviteRole, setInviteRole] = useState('concierge');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const roleLabel = user?.role === 'admin' ? 'Síndico'
    : user?.role === 'subadmin' ? 'Gestão'
    : user?.role === 'concierge' ? 'Porteiro'
    : user?.role === 'financial' ? 'Financeiro'
    : 'Morador';

  const loadStaff = async () => {
    try {
      const { data } = await api.get<StaffMember[]>('/auth/staff');
      setStaff(data);
      setStaffLoaded(true);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    if (isPureAdmin) loadStaff();
  }, []);

  const validateEmail = (val: string) => {
    const v = val.trim().toLowerCase();
    if (!v) { setInviteEmailError('E-mail é obrigatório'); return false; }
    if (!EMAIL_RE.test(v)) {
      setInviteEmailError('Digite um e-mail válido. Exemplo: nome@gmail.com');
      return false;
    }
    const domain = v.split('@')[1];
    if (!ALLOWED_DOMAINS.has(domain)) {
      setInviteEmailError('Use um e-mail válido com domínio conhecido, como gmail.com, icloud.com, outlook.com ou hotmail.com.');
      return false;
    }
    setInviteEmailError('');
    return true;
  };

  const handleInvite = async () => {
    if (isDemo) { blockAction(); return; }
    const email = inviteEmail.trim();
    if (!validateEmail(email)) return;
    setInviteLoading(true);
    setInviteLink('');
    try {
      await api.post('/auth/invite-staff', { email, role: inviteRole });
      setInviteLink(`${window.location.origin}/login`);
      setInviteEmail('');
      loadStaff();
      toast.success('Colaborador adicionado! Senha inicial: 123456');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar colaborador');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (isDemo) { blockAction(); return; }
    try {
      await api.delete(`/auth/staff/${id}`);
      setStaff((prev) => prev.filter((s) => s._id !== id));
      toast.success('Colaborador removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleLogout = () => {
    if (isDemo) { blockAction(); return; }
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-[-0.04em] text-slate-950">Configurações</h1>
          <p className="text-xs font-semibold text-slate-500">Conta, perfil e colaboradores</p>
        </div>
      </div>

      {/* Conta */}
      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Informações da conta</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">E-mail</span>
            </div>
            <p className="text-sm font-extrabold text-slate-950 break-all">{user?.email || '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-slate-500">
              <UserCog className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cargo</span>
            </div>
            <p className="text-sm font-extrabold text-slate-950">{roleLabel}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sessão</span>
            </div>
            <p className="text-sm font-extrabold text-emerald-800">Ativa</p>
          </div>
        </div>
      </section>

      {/* Colaboradores — apenas admin (Pro/Ultra) */}
      {isPureAdmin && (
        <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Colaboradores</p>
          <h2 className="mb-4 text-base font-black tracking-[-0.03em] text-slate-950">Adicionar por cargo</h2>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <input
                type="email"
                placeholder="E-mail do colaborador"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); if (e.target.value.trim().length > 0) validateEmail(e.target.value); }}
                onBlur={(e) => validateEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${inviteEmailError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : 'border-violet-100 focus:border-violet-400 focus:ring-violet-500/20'} bg-white`}
              />
              {inviteEmailError && <p className="text-xs font-semibold text-red-600">{inviteEmailError}</p>}
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="concierge">Porteiro</option>
              <option value="financial">Financeiro</option>
              <option value="subadmin">Gestão</option>
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteLoading || !!inviteEmailError}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-800 disabled:opacity-60"
            >
              {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Convidar
            </button>
          </div>

          {inviteLink && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Acesso criado · senha inicial: 123456</p>
              <div className="flex items-center gap-2">
              <p className="flex-1 truncate text-xs font-semibold text-emerald-800">{inviteLink}</p>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Copiado!'); }}
                className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800"
              >
                Copiar
              </button>
              </div>
            </div>
          )}

          {staffLoaded && staff.length === 0 && (
            <p className="text-sm font-semibold text-slate-400">Nenhum colaborador cadastrado ainda.</p>
          )}

          {staff.length > 0 && (
            <div className="space-y-2">
              {staff.map((member) => (
                <div key={member._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <UserCog className="h-4 w-4 shrink-0 text-violet-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{member.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {member.email} · {CARGO_LABELS[member.role] || member.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(member._id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Encerrar sessão */}
      <div className="pt-2">
        <Button variant="danger" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="w-full justify-center sm:w-auto">
          Encerrar sessão
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
