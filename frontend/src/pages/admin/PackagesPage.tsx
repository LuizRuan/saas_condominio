import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import { PackageOpen, Plus, Trash2, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { packageService, Package } from '../../services/packageService';
import { Unit } from '../../types';
import toast from 'react-hot-toast';

const PackagesPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [packages, setPackages] = useState<Package[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  // Forms
  const [form, setForm] = useState({ unitId: '', description: '', trackingCode: '', notes: '' });
  const [deliverForm, setDeliverForm] = useState({ deliveredTo: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPackages = async () => {
    try {
      const data = await packageService.getAll();
      setPackages(data);
    } catch {
      toast.error('Erro ao buscar encomendas');
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await api.get('/units');
      setUnits(data);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchPackages(), fetchUnits()]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setForm({ unitId: '', description: '', trackingCode: '', notes: '' });
    setCreateModalOpen(true);
  };

  const openDeliver = (pkg: Package) => {
    setSelectedPackage(pkg);
    setDeliverForm({ deliveredTo: '' });
    setDeliverModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.unitId || !form.description) {
      toast.error('Preencha a unidade e a descrição');
      return;
    }
    setSaving(true);
    try {
      await packageService.create(form);
      toast.success('Encomenda registrada!');
      setCreateModalOpen(false);
      fetchPackages();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao registrar encomenda');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliver = async () => {
    if (!selectedPackage) return;
    setSaving(true);
    try {
      await packageService.markAsDelivered(selectedPackage._id, deliverForm.deliveredTo);
      toast.success('Baixa realizada com sucesso!');
      setDeliverModalOpen(false);
      fetchPackages();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao dar baixa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await packageService.delete(deleteTarget._id);
      toast.success('Encomenda excluída!');
      setDeleteTarget(null);
      fetchPackages();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return packages;

    return packages.filter((pkg) => {
      const blockNum = `Bloco ${pkg.unitId?.block} Apt ${pkg.unitId?.number}`.toLowerCase();
      return (
        pkg.description.toLowerCase().includes(query) ||
        (pkg.trackingCode && pkg.trackingCode.toLowerCase().includes(query)) ||
        blockNum.includes(query)
      );
    });
  }, [search, packages]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  const pendingPackages = packages.filter(p => p.status === 'pending');
  const deliveredPackages = packages.filter(p => p.status === 'delivered');

  return (
    <PremiumPage
      title="Encomendas"
      subtitle="Gerencie o recebimento e entrega de encomendas e pacotes na portaria."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar descrição, unidade ou rastreio..."
      actions={(
        <Button
          onClick={openCreate}
          icon={<Plus className="h-4 w-4" />}
          className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto"
        >
          Registrar Entrada
        </Button>
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total de Encomendas" value={packages.length} helper="registros" icon={<PackageOpen className="h-4 w-4" />} />
        <MetricCard label="Aguardando Retirada" value={pendingPackages.length} helper="pendentes" icon={<AlertCircle className="h-4 w-4" />} iconClass="bg-amber-100 text-amber-700" valueClassName="text-amber-600" />
        <MetricCard label="Entregues" value={deliveredPackages.length} helper="já retiradas" icon={<PackageCheck className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="flex items-center justify-between gap-4 border-b border-violet-100/80 px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Lista de Encomendas</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {search ? `${filteredPackages.length} resultado(s) encontrados` : 'Acompanhe as encomendas do condomínio'}
            </p>
          </div>
        </div>

        {filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <PackageOpen className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              Nenhuma encomenda encontrada
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {packages.length === 0 ? 'Registre a primeira encomenda para notificarmos o morador.' : 'Tente buscar por outro termo.'}
            </p>
            {packages.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Registrar Encomenda
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full">
              <thead>
                <tr className="border-b border-violet-50 bg-[#fbf8ff]">
                  <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Data/Hora</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Unidade</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Descrição</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-7 py-4 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-50">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg._id} className="transition hover:bg-violet-50/35">
                    <td className="px-7 py-4">
                      <div className="text-sm font-extrabold text-slate-800">
                        {new Date(pkg.receivedAt).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs font-semibold text-slate-400">
                        {new Date(pkg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {pkg.unitId?.block ? `Bl ${pkg.unitId.block} - ` : ''}Apt {pkg.unitId?.number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-800">{pkg.description}</p>
                      {pkg.trackingCode && (
                        <p className="text-xs text-slate-500 font-medium">Rastreio: {pkg.trackingCode}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {pkg.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Aguardando
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Entregue
                        </span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        {pkg.status === 'pending' && (
                          <button type="button" onClick={() => openDeliver(pkg)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Dar Baixa" aria-label="Marcar como entregue">
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteTarget(pkg)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" aria-label="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Criar */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Registrar Encomenda">
        <div className="space-y-4">
          <Select
            label="Unidade Destino *"
            value={form.unitId}
            onChange={(e) => setForm({ ...form, unitId: e.target.value })}
            options={[
              { value: '', label: 'Selecione uma unidade' },
              ...units.map(u => ({
                value: u._id,
                label: `${u.block ? `Bloco ${u.block} - ` : ''}Apt ${u.number}`
              }))
            ]}
          />
          <Input label="Descrição do Pacote *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Caixa Mercado Livre, Envelope..." />
          <Input label="Código de Rastreio (Opcional)" value={form.trackingCode} maxLength={50} onChange={(e) => setForm({ ...form, trackingCode: e.target.value })} placeholder="Ex: NL123456789BR (máx. 50 caracteres)" />
          <Input label="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Baixa */}
      <Modal isOpen={deliverModalOpen} onClose={() => setDeliverModalOpen(false)} title="Dar Baixa na Encomenda">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Confirme a entrega da encomenda <strong>{selectedPackage?.description}</strong> para a unidade.
          </p>
          <Input label="Entregue para (Nome da pessoa) - Opcional" value={deliverForm.deliveredTo} onChange={(e) => setDeliverForm({ deliveredTo: e.target.value })} placeholder="Ex: João (Morador) ou Deixado na porta..." />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeliverModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleDeliver} loading={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700 text-white shadow-emerald-600/20">Confirmar Entrega</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Registro?"
        description="Tem certeza que deseja apagar o registro desta encomenda do sistema? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PremiumPage>
  );
};

export default PackagesPage;
