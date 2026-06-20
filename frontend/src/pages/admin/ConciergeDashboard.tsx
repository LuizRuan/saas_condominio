import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PremiumPage from '../../components/ui/PremiumPage';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, UserCheck, LogOut, Package, Truck, UserCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Access, Unit } from '../../types';
import toast from 'react-hot-toast';
import { getUnitLabel, formatDate } from '../../utils/helpers';
import { useDemo } from '../../contexts/DemoContext';

const accessTypeLabels: Record<string, string> = {
  visitor: 'Visitante',
  service_provider: 'Prestador de Serviço',
  delivery: 'Entrega'
};

const ConciergeDashboard: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  const [form, setForm] = useState({
    unitId: '',
    visitorName: '',
    documentType: 'rg',
    documentNumber: '',
    type: 'visitor',
    vehiclePlate: '',
    notes: ''
  });

  const { data: accesses = [], isLoading } = useQuery<Access[]>({
    queryKey: ['accesses', filterStatus],
    queryFn: async () => {
      const { data } = await api.get('/access', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } });
      return data;
    }
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/units');
      return data;
    }
  });

  const handleCreate = async () => {
    if (!form.visitorName || !form.type) {
      toast.error('Preencha os campos obrigatórios (Nome e Tipo).');
      return;
    }

    setSaving(true);
    try {
      await api.post('/access', form);
      toast.success('Entrada registrada com sucesso!');
      setModalOpen(false);
      setForm({
        unitId: '', visitorName: '', documentType: 'rg', documentNumber: '', type: 'visitor', vehiclePlate: '', notes: ''
      });
      queryClient.invalidateQueries({ queryKey: ['accesses'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao registrar entrada');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (id: string) => {
    try {
      await api.patch(`/access/${id}/finish`);
      toast.success('Saída registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['accesses'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao registrar saída');
    }
  };

  const filteredAccesses = accesses.filter(access => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      access.visitorName,
      access.documentNumber,
      access.vehiclePlate,
      getUnitLabel(access.unitId)
    ].some(val => val?.toLowerCase().includes(query));
  });

  if (isLoading || loadingUnits) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Painel da Portaria"
      subtitle="Controle de acessos, visitantes e prestadores de serviço em tempo real."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nome, documento ou placa..."
      actions={(
        <Button
          onClick={isDemo ? blockAction : () => setModalOpen(true)}
          icon={<UserCheck className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Registrar Entrada
        </Button>
      )}
    >
      <div className="mt-6 flex flex-wrap gap-3 mb-6">
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'active', label: 'Apenas presentes (Ativos)' },
            { value: 'finished', label: 'Já saíram (Finalizados)' },
            { value: 'all', label: 'Todos os registros' }
          ]}
          className="w-full sm:w-64"
        />
      </div>

      <section className="data-table-wrapper">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Acessos e Visitantes</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Controle quem entra e sai do condomínio.
            </p>
          </div>
        </div>

        {filteredAccesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800">Nenhum registro encontrado</h3>
            <p className="mt-1.5 max-w-sm text-sm font-medium text-slate-400">
              {filterStatus === 'active' 
                ? 'Nenhum visitante ou prestador de serviço presente no momento.'
                : 'Nenhum acesso corresponde à sua busca.'}
            </p>
          </div>
        ) : (
          <div className="data-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Destino (Unidade)</th>
                  <th>Placa do Veículo</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccesses.map((access) => (
                  <tr key={access._id}>
                    <td>
                      <p className="font-bold text-slate-800">{access.visitorName}</p>
                      {access.documentNumber && (
                        <p className="mt-0.5 text-xs font-medium text-slate-400">Doc: {access.documentNumber}</p>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${
                        access.type === 'visitor' ? 'bg-blue-50 text-blue-700' :
                        access.type === 'delivery' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {access.type === 'visitor' && <UserCircle2 className="h-3 w-3" />}
                        {access.type === 'delivery' && <Package className="h-3 w-3" />}
                        {access.type === 'service_provider' && <Truck className="h-3 w-3" />}
                        {accessTypeLabels[access.type]}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-700">{getUnitLabel(access.unitId) || 'Área Comum'}</td>
                    <td className="font-medium text-slate-500">{access.vehiclePlate || '—'}</td>
                    <td className="text-slate-500 text-sm">{formatDate(access.entryTime)}</td>
                    <td className="text-slate-500 text-sm">{access.exitTime ? formatDate(access.exitTime) : '—'}</td>
                    <td className="text-right">
                      {access.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => isDemo ? blockAction() : handleFinish(access._id)}
                          icon={<LogOut className="h-3.5 w-3.5" />}
                          className="hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          Dar saída
                        </Button>
                      ) : (
                        <StatusBadge status="resolved" label="Finalizado" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Entrada" size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome completo *" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} autoFocus />
            <Select label="Tipo de Acesso *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[
              { value: 'visitor', label: 'Visitante' },
              { value: 'service_provider', label: 'Prestador de Serviço' },
              { value: 'delivery', label: 'Entrega' }
            ]} />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Destino (Unidade)" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} options={[
              { value: '', label: 'Área Comum / Administração' },
              ...units.map(u => ({ value: u._id, label: `${u.block ? 'Bl ' + u.block + ' - ' : ''}Apt ${u.number}` }))
            ]} />
            <Input label="Placa do Veículo" placeholder="ABC-1234" value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tipo de Documento" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} options={[
              { value: 'rg', label: 'RG' },
              { value: 'cpf', label: 'CPF' },
              { value: 'other', label: 'Outro' }
            ]} />
            <Input label="Número do Documento" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
          </div>

          <Input label="Observações adicionais" placeholder="Empresa, motivo, etc..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1" icon={<Plus className="h-4 w-4" />}>Confirmar Entrada</Button>
          </div>
        </div>
      </Modal>
    </PremiumPage>
  );
};

export default ConciergeDashboard;
