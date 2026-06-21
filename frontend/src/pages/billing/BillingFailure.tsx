import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const BillingFailure: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-5 text-center">
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm max-w-sm w-full">
      <XCircle className="mx-auto h-12 w-12 text-red-500" />
      <h1 className="mt-5 text-xl font-extrabold text-slate-900">Pagamento não concluído</h1>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
        Ocorreu um problema com seu pagamento. Tente novamente ou entre em contato com o suporte.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          to="/"
          className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
        >
          Ver planos novamente
        </Link>
        <Link
          to="/dashboard"
          className="inline-block rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Ir para o dashboard
        </Link>
      </div>
    </div>
  </div>
);

export default BillingFailure;
