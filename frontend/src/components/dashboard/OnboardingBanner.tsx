import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Building2, Home, Users, Receipt, TrendingDown } from 'lucide-react';
import Button from '../ui/Button';

interface OnboardingBannerProps {
  totalUnits: number;
}

const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ totalUnits }) => {
  const navigate = useNavigate();

  if (totalUnits > 0) return null;

  const steps = [
    { title: 'Cadastre o condomínio', icon: Building2, link: '/condominio', done: false },
    { title: 'Cadastre as unidades', icon: Home, link: '/unidades', done: false },
    { title: 'Cadastre os moradores', icon: Users, link: '/moradores', done: false },
    { title: 'Gere as primeiras cobranças', icon: Receipt, link: '/cobrancas', done: false },
    { title: 'Lance as primeiras despesas', icon: TrendingDown, link: '/despesas', done: false },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-blue-50/50 p-6 shadow-sm">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
      
      <div className="relative">
        <h2 className="text-xl font-extrabold text-blue-950">Comece por aqui 👋</h2>
        <p className="mt-1 text-sm font-medium text-blue-800/70">
          Seu condomínio ainda não possui unidades cadastradas. Siga os passos abaixo para configurar o sistema.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => navigate(step.link)}
              className="group flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-slate-700">{step.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OnboardingBanner;
