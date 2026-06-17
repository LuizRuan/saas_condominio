import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppNotification } from '../../types';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';
import Button from './Button';
import Modal from './Modal';

type PanelKey = 'notifications';
type NotificationTone = 'violet' | 'emerald' | 'orange' | 'blue' | 'slate';

interface ActionItem {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

const getInitials = (name?: string) => (
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JS'
);

const formatRelativeTime = (date: string) => {
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return formatDate(date);

  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;

  return formatDate(date);
};

const toneClasses: Record<NotificationTone, string> = {
  violet: 'bg-violet-100 text-violet-700 group-hover:bg-violet-700 group-hover:text-white',
  emerald: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
  orange: 'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white',
  blue: 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
  slate: 'bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white',
};

const notificationIcons: Record<AppNotification['type'], LucideIcon> = {
  payment: CreditCard,
  issue: AlertTriangle,
  reservation: CalendarDays,
  announcement: Megaphone,
  system: ShieldCheck,
};

const notificationTones: Record<AppNotification['type'], NotificationTone> = {
  payment: 'emerald',
  issue: 'orange',
  reservation: 'violet',
  announcement: 'blue',
  system: 'slate',
};

const notificationTags: Record<AppNotification['type'], string> = {
  payment: 'Pagamento',
  issue: 'Ocorrência',
  reservation: 'Reserva',
  announcement: 'Comunicado',
  system: 'Sistema',
};

const TopbarActions: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPanel) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPanel]);

  const homePath = isAdmin ? '/dashboard' : '/morador';
  const settingsPath = isAdmin ? '/condominio' : '/morador';
  const roleLabel = isAdmin ? 'Síndico administrador' : 'Morador';

  const settingsItems: ActionItem[] = isAdmin
    ? [
      { label: 'Dados do condomínio', description: 'Endereço, cobrança padrão e chave Pix.', to: '/condominio', icon: Building2 },
      { label: 'Unidades', description: 'Estrutura, ocupação e inadimplência.', to: '/unidades', icon: LayoutDashboard },
      { label: 'Moradores', description: 'Responsáveis, perfis e vínculos.', to: '/moradores', icon: Users },
      { label: 'Cobranças', description: 'Configurar e acompanhar pagamentos.', to: '/cobrancas', icon: CreditCard },
      { label: 'Comunicados', description: 'Gerenciar avisos e fotos publicadas.', to: '/comunicados', icon: Megaphone },
      { label: 'Reservas', description: 'Revisar solicitações de áreas comuns.', to: '/reservas', icon: CalendarDays },
    ]
    : [
      { label: 'Meu painel', description: 'Resumo da sua unidade e pendências.', to: '/morador', icon: LayoutDashboard },
      { label: 'Minhas cobranças', description: 'Consultar pagamentos e vencimentos.', to: '/morador/cobrancas', icon: CreditCard },
      { label: 'Minhas reservas', description: 'Preferências de áreas comuns.', to: '/morador/reservas', icon: CalendarDays },
      { label: 'Minhas ocorrências', description: 'Histórico de solicitações abertas.', to: '/morador/ocorrencias', icon: AlertTriangle },
    ];

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');

    try {
      const { data } = await api.get<AppNotification[]>('/notifications', { params: { limit: 20 } });
      setNotifications(data);
      setNotificationsLoaded(true);
    } catch {
      setNotificationsError('Não foi possível carregar as notificações agora.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !notificationsLoaded && !notificationsLoading) {
      loadNotifications();
    }
  }, [user?.id]);

  const goTo = (to: string) => {
    setOpenPanel(null);
    setSettingsOpen(false);
    setProfileOpen(false);
    navigate(to);
  };

  const openNotification = async (notification: AppNotification) => {
    const target = notification.link || homePath;

    setNotifications((current) => current.map((item) => (
      item._id === notification._id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
    )));

    if (!notification.readAt) {
      api.patch(`/notifications/${notification._id}/read`).catch(() => {
        setNotificationsLoaded(false);
      });
    }

    goTo(target);
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));
    } catch {
      setNotificationsError('Não foi possível marcar as notificações como lidas.');
    }
  };

  const handleLogout = () => {
    setOpenPanel(null);
    setSettingsOpen(false);
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const togglePanel = (panel: PanelKey) => {
    setOpenPanel((currentPanel) => {
      const nextPanel = currentPanel === panel ? null : panel;
      if (nextPanel === 'notifications' && !notificationsLoaded && !notificationsLoading) {
        loadNotifications();
      }
      return nextPanel;
    });
  };

  const openProfile = () => {
    setOpenPanel(null);
    setSettingsOpen(false);
    setProfileOpen(true);
  };

  const openSettings = () => {
    setOpenPanel(null);
    setProfileOpen(false);
    setSettingsOpen(true);
  };

  const actionButtonClass = 'relative h-10 w-10 items-center justify-center rounded-2xl border border-violet-100 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10';
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const hasNotifications = unreadCount > 0;

  return (
    <>
      <div ref={containerRef} className="relative ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => togglePanel('notifications')}
          className={`${actionButtonClass} hidden sm:inline-flex`}
          aria-label="Abrir notificações"
          aria-expanded={openPanel === 'notifications'}
        >
          {notificationsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {hasNotifications && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
              {Math.min(unreadCount, 9)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={openSettings}
          className={`${actionButtonClass} hidden sm:inline-flex`}
          aria-label="Abrir configurações"
        >
          <Settings className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={openProfile}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-violet-700 text-xs font-extrabold text-white shadow-lg shadow-violet-900/15 transition hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-violet-500/20"
          aria-label="Abrir perfil"
        >
          {getInitials(user?.name)}
        </button>

        {openPanel && (
          <div className="absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_28px_80px_rgba(76,29,149,0.18)] ring-1 ring-slate-950/5">
            {openPanel === 'notifications' && (
              <div>
                <div className="border-b border-violet-50 bg-[#fbf8ff] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Central</p>
                      <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">Notificações reais</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Eventos gerados por moradores: solicitações, reservas e pagamentos.
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-[11px] font-black text-violet-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
                      >
                        Ler tudo
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[28rem] overflow-y-auto p-3">
                  {notificationsLoading && (
                    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-bold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-700" />
                      Carregando notificações...
                    </div>
                  )}

                  {!notificationsLoading && notificationsError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                      {notificationsError}
                    </div>
                  )}

                  {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
                        <Bell className="h-6 w-6" />
                      </div>
                      <h4 className="mt-4 text-sm font-black text-slate-950">Nenhuma notificação real</h4>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        Quando um morador solicitar reserva, abrir ocorrência ou tiver pagamento confirmado, aparecerá aqui.
                      </p>
                    </div>
                  )}

                  {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                    <div className="space-y-2">
                      {notifications.map((item) => {
                        const Icon = notificationIcons[item.type];
                        const isUnread = !item.readAt;

                        return (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => openNotification(item)}
                            className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-violet-50 ${isUnread ? 'bg-violet-50/70 ring-1 ring-violet-100' : ''}`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${toneClasses[notificationTones[item.type]]}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-extrabold text-slate-950">{item.title}</span>
                                {isUnread && <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Não lida" />}
                              </span>
                              <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{item.message}</span>
                              <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black text-violet-700 ring-1 ring-violet-100">
                                {notificationTags[item.type]} • {formatRelativeTime(item.createdAt)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configurações" size="lg">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-950 to-blue-950 p-5 text-white shadow-[0_20px_70px_rgba(76,29,149,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Centro de controle</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">Configurações do sistema</h3>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-violet-100">
                  Ajuste cadastros, operação e preferências principais do Condomínio em Dia em um só lugar.
                </p>
              </div>
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 sm:flex">
                <Settings className="h-6 w-6" />
              </div>
            </div>
          </div>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Atalhos</p>
                <h4 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">Configurar operação</h4>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-100">
                {isAdmin ? 'Admin' : 'Morador'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {settingsItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className="group rounded-2xl border border-violet-100 bg-white p-4 text-left shadow-[0_12px_35px_rgba(76,29,149,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-950">{item.label}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span>
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-violet-700" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Conta</p>
              <p className="mt-2 text-sm font-extrabold text-slate-950">{user?.email || 'Sem e-mail'}</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Perfil</p>
              <p className="mt-2 text-sm font-extrabold text-slate-950">{roleLabel}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Segurança</p>
              <p className="mt-2 text-sm font-extrabold text-emerald-800">Sessão ativa</p>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-violet-100 pt-4 sm:flex-row">
            <Button variant="secondary" onClick={() => goTo('/perfil')} icon={<UserRound className="h-4 w-4" />} className="flex-1">
              Perfil e dados
            </Button>
            <Button variant="danger" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="flex-1">
              Encerrar sessão
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Perfil do usuário" size="md">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-violet-700 p-5 text-white shadow-[0_20px_70px_rgba(76,29,149,0.2)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-lg font-black ring-1 ring-white/20">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-[-0.04em]">{user?.name || 'Usuário'}</p>
                <p className="mt-1 truncate text-sm font-semibold text-violet-100">{user?.email || 'Sem e-mail cadastrado'}</p>
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black ring-1 ring-white/15">
              <ShieldCheck className="h-4 w-4" />
              {roleLabel}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Telefone</p>
              <p className="mt-2 text-sm font-extrabold text-slate-950">{user?.phone || 'Não informado'}</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Perfil</p>
              <p className="mt-2 text-sm font-extrabold text-slate-950">{roleLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => goTo(homePath)} icon={<LayoutDashboard className="h-4 w-4" />}>
              Ir para painel
            </Button>
            <Button variant="secondary" onClick={() => goTo('/perfil')} icon={<UserRound className="h-4 w-4" />}>
              Perfil e dados
            </Button>
          </div>

          <Button variant="danger" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="w-full">
            Encerrar sessão
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default TopbarActions;
