import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const BillingSuccess: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-5 text-center">
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm max-w-sm w-full">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h1 className="mt-5 text-xl font-extrabold text-slate-900">Quase lá!</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
        Seu pagamento foi recebido. A ativação do plano ocorre automaticamente em alguns minutos após a confirmação.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
      >
        Ir para o dashboard
      </Link>
    </div>
  </div>
);

export default BillingSuccess;
