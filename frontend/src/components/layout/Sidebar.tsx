import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Home, Users, Receipt, Megaphone,
  AlertTriangle, CalendarDays, LogOut, X, Package,
  ChevronRight, TrendingDown, Wallet, FileText,
} from 'lucide-react';
import BrandMark from '../ui/BrandMark';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'principal' },
  { to: '/condominio', icon: Building2, label: 'Condomínio', section: 'gestão' },
  { to: '/unidades', icon: Home, label: 'Unidades', section: 'gestão' },
  { to: '/moradores', icon: Users, label: 'Moradores', section: 'gestão' },
  { to: '/cobrancas', icon: Receipt, label: 'Cobranças', section: 'financeiro' },
  { to: '/despesas', icon: TrendingDown, label: 'Despesas', section: 'financeiro' },
  { to: '/caixa', icon: Wallet, label: 'Caixa', section: 'financeiro' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios', section: 'financeiro' },
  { to: '/comunicados', icon: Megaphone, label: 'Comunicados', section: 'comunicação' },
  { to: '/encomendas', icon: Package, label: 'Encomendas', section: 'comunicação' },
  { to: '/ocorrencias', icon: AlertTriangle, label: 'Ocorrências', section: 'comunicação' },
  { to: '/reservas', icon: CalendarDays, label: 'Reservas', section: 'comunicação' },
];

const residentLinks = [
  { to: '/morador', icon: LayoutDashboard, label: 'Meu Painel', section: 'principal' },
  { to: '/morador/cobrancas', icon: Receipt, label: 'Minhas Cobranças', section: 'financeiro' },
  { to: '/morador/comunicados', icon: Megaphone, label: 'Comunicados', section: 'serviços' },
  { to: '/morador/encomendas', icon: Package, label: 'Encomendas', section: 'serviços' },
  { to: '/morador/ocorrencias', icon: AlertTriangle, label: 'Ocorrências', section: 'serviços' },
  { to: '/morador/reservas', icon: CalendarDays, label: 'Reservas', section: 'serviços' },
];

const sectionLabel: Record<string, string> = {
  principal: 'Principal',
  gestão: 'Gestão',
  financeiro: 'Financeiro',
  comunicação: 'Comunicação',
  serviços: 'Serviços',
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = isAdmin ? adminLinks : residentLinks;

  // Group links by section
  const sections = links.reduce<Record<string, typeof links>>((acc, link) => {
    if (!acc[link.section]) acc[link.section] = [];
    acc[link.section].push(link);
    return acc;
  }, {});

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[272px] flex-col overflow-hidden transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'
        }`}
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #0d1b3e 60%, #140d2e 100%)',
        }}
      >
        {/* Top glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-blue-600/12 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-64 w-40 -translate-y-1/2 rounded-full bg-violet-700/8 blur-3xl" />

        {/* Brand header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.07] px-5 py-5">
          <BrandMark inverted />
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(sections).map(([section, sectionLinks]) => (
            <div key={section} className="mb-5">
              {/* Section label */}
              <p className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">
                {sectionLabel[section] || section}
              </p>

              <div className="space-y-0.5">
                {sectionLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                              : 'bg-white/[0.06] text-slate-500 group-hover:bg-white/10 group-hover:text-slate-200'
                          }`}
                        >
                          <link.icon className="h-[15px] w-[15px]" strokeWidth={isActive ? 2.5 : 2} />
                        </span>
                        <span className="flex-1 truncate">{link.label}</span>
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="relative border-t border-white/[0.07] p-3">
          <div className="overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.08]">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Avatar */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-extrabold text-white shadow-md shadow-violet-900/30">
                {user?.name?.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white">{user?.name}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                  {isAdmin ? 'Síndico' : 'Morador'}
                </p>
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-3 py-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Encerrar sessão
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
