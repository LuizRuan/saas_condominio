import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PremiumPage from '../../components/ui/PremiumPage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MetricCard from '../../components/ui/MetricCard';
import { PackageOpen, AlertCircle, PackageCheck, PackageSearch } from 'lucide-react';
import { packageService, Package } from '../../services/packageService';
import toast from 'react-hot-toast';

const MyPackages: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await packageService.getResidentPackages();
      setPackages(data);
    } catch {
      toast.error('Erro ao buscar suas encomendas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Buscando encomendas..." />;

  const pendingPackages = packages.filter(p => p.status === 'pending');
  const deliveredPackages = packages.filter(p => p.status === 'delivered');

  return (
    <PremiumPage
      title="Minhas Encomendas"
      subtitle="Acompanhe os pacotes e correspondências recebidos na portaria."
      onMenuClick={onMenuClick}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricCard label="Aguardando Retirada" value={pendingPackages.length} helper="na portaria" icon={<AlertCircle className="h-5 w-5" />} iconClass="bg-amber-100 text-amber-700" valueClassName="text-amber-600" />
        <MetricCard label="Histórico de Entregas" value={deliveredPackages.length} helper="já retiradas" icon={<PackageCheck className="h-5 w-5" />} iconClass="bg-emerald-100 text-emerald-700" />
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900">Aguardando Retirada</h3>
        {pendingPackages.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-white/50 px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-400">
              <PackageSearch className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">Oba! Você não tem encomendas pendentes na portaria.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingPackages.map((pkg) => (
              <div key={pkg._id} className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white p-5 shadow-sm">
                <div className="absolute right-0 top-0 h-full w-1.5 bg-amber-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900">{pkg.description}</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Chegou em {new Date(pkg.receivedAt).toLocaleDateString('pt-BR')} às {new Date(pkg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {pkg.trackingCode && <p className="mt-2 text-xs font-medium text-slate-600">Rastreio: {pkg.trackingCode}</p>}
                  </div>
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                    Pendente
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Por favor, retire sua encomenda na portaria.
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900">Histórico</h3>
        {deliveredPackages.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">Nenhum histórico de encomendas.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {deliveredPackages.map(pkg => (
                <li key={pkg._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <PackageOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{pkg.description}</p>
                      <p className="text-xs font-medium text-slate-500">Entregue em {new Date(pkg.deliveredAt!).toLocaleDateString('pt-BR')} às {new Date(pkg.deliveredAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  {pkg.deliveredTo && (
                    <div className="text-sm font-medium text-slate-600">
                      Retirado por: <span className="font-bold text-slate-800">{pkg.deliveredTo}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </PremiumPage>
  );
};

export default MyPackages;
