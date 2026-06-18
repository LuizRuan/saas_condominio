import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PremiumPage from '../components/ui/PremiumPage';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, ShieldCheck, UserRound, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [dataForm, setDataForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setDataForm({ name: user.name, phone: user.phone || '' });
    }
  }, [user]);

  const handleUpdateData = async () => {
    if (!dataForm.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    setLoadingData(true);
    try {
      const { data } = await api.put('/users/profile', dataForm);
      updateUser(data as User);
      toast.success('Perfil atualizado com sucesso!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('A nova senha e a confirmação não conferem');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoadingPassword(true);
    try {
      await api.put('/users/profile/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Senha alterada com sucesso!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoadingPassword(false);
    }
  };

  const initials = (user?.name ?? 'US')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <PremiumPage
      eyebrow="Conta"
      title="Perfil e dados"
      subtitle="Gerencie suas informações pessoais e credenciais de segurança."
      onMenuClick={onMenuClick}
      actions={(
        <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar
        </Button>
      )}
    >
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* ── Forms column ── */}
        <div className="flex flex-col gap-6">

          {/* Dados pessoais */}
          <div className="surface-panel">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title">Dados Pessoais</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">Informações de contato e identificação no condomínio.</p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Nome completo *"
                  value={dataForm.name}
                  onChange={(e) => setDataForm({ ...dataForm, name: e.target.value })}
                />
                <div>
                  <Input
                    label="E-mail (Login)"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-400">Não é possível alterar o e-mail de acesso.</p>
                </div>
                <Input
                  label="Telefone (WhatsApp)"
                  value={dataForm.phone}
                  onChange={(e) => setDataForm({ ...dataForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  containerClassName="sm:col-span-2"
                />
              </div>
              <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                <Button onClick={handleUpdateData} loading={loadingData}>
                  Salvar alterações
                </Button>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="surface-panel">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title">Segurança</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">Defina uma nova senha de acesso ao sistema.</p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Senha atual *"
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="Sua senha atual"
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label="Nova senha *"
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <Input
                  label="Confirmar nova senha *"
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Repita a nova senha"
                />
              </div>
              <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                <Button variant="secondary" onClick={handleUpdatePassword} loading={loadingPassword}>
                  Atualizar senha
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <div className="surface-card p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-blue-700 text-2xl font-black text-white shadow-xl shadow-blue-900/15">
              {initials}
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">{user?.name}</h3>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              {user?.role === 'admin' ? 'Síndico administrador' : 'Morador'}
            </div>
          </div>

          <div className="surface-card bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/20">
            <h3 className="text-sm font-extrabold tracking-tight">Privacidade e Dados</h3>
            <p className="mt-2 text-xs font-medium leading-6 text-slate-400">
              Suas informações de contato são usadas apenas para notificações do condomínio (encomendas, ocorrências e comunicados). O e-mail é a chave de acesso da conta e não pode ser alterado.
            </p>
          </div>
        </aside>

      </div>
    </PremiumPage>
  );
};

export default ProfilePage;
