import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import ImportWizard from '../../components/units/ImportWizard';
import { AlertTriangle, Building2, CheckCircle2, Home, Pencil, Plus, Trash2, UploadCloud } from 'lucide-react';
import api from '../../services/api';
import { Unit } from '../../types';
import toast from 'react-hot-toast';
import { useDemo } from '../../contexts/DemoContext';
import { useAuth } from '../../contexts/AuthContext';

const UnitsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const { isFinancial } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: unitsResponse, isLoading: loading } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/units');
      return data;
    },
  });
  const units: Unit[] = unitsResponse ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [form, setForm] = useState({ block: '', number: '', status: 'empty', notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ block: '', number: '', status: 'empty', notes: '' });
    setModalOpen(true);
  };
  const openEdit = (u: Unit) => {
    setEditing(u);
    setForm({ block: u.block, number: u.number, status: u.status, notes: u.notes });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.number) { toast.error('Informe o número'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/units/${editing._id}`, form); toast.success('Atualizada!'); }
      else { await api.post('/units', form); toast.success('Cadastrada!'); }
      setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['units'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget._id;
    setSaving(true);
    try {
      await api.delete(`/units/${deletedId}`);
      toast.success('Unidade excluída!');
      setDeleteTarget(null);
      if (editing?._id === deletedId) { setModalOpen(false); setEditing(null); }
      queryClient.invalidateQueries({ queryKey: ['units'] });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return units;
    return units.filter((unit) =>
      [unit.block, unit.number, unit.status, unit.notes].some((v) => v?.toLowerCase().includes(query))
    );
  }, [search, units]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Unidades"
      subtitle="Controle ocupação, inadimplência e informações de cada unidade."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar unidades, blocos..."
      actions={!isFinancial ? (
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={isDemo ? blockAction : () => setWizardOpen(true)} variant="secondary" icon={<UploadCloud className="h-4 w-4" />} className="flex-1 sm:flex-none">
            Importar Excel/PDF
          </Button>
          <Button onClick={isDemo ? blockAction : openCreate} icon={<Plus className="h-4 w-4" />} className="flex-1 sm:flex-none">
            Nova unidade
          </Button>
        </div>
      ) : undefined}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total de unidades" value={units.length} helper="cadastradas" icon={<Building2 className="h-4 w-4" />} />
        <MetricCard label="Ocupadas" value={units.filter((u) => u.status === 'occupied').length} helper="em uso" icon={<CheckCircle2 className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" />
        <MetricCard label="Vazias" value={units.filter((u) => u.status === 'empty').length} helper="disponíveis" icon={<Home className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-600" />
        <MetricCard label="Inadimplentes" value={units.filter((u) => u.status === 'late').length} helper="atenção" icon={<AlertTriangle className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
      </section>

      <section className="data-table-wrapper mt-6">
        <div className="data-table-header">
          <div>
            <h2 className="section-title">Lista de Unidades</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {search ? `${filteredUnits.length} resultado(s) encontrados` : 'Cadastro estrutural do condomínio'}
            </p>
          </div>
        </div>

        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-800">
              {units.length === 0 ? 'Nenhuma unidade cadastrada' : 'Nenhuma unidade encontrada'}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm font-medium text-slate-400">
              {units.length === 0 ? (
                <>
                  Cadastre apartamentos, casas ou salas para vincular moradores, cobranças, reservas e encomendas.<br/>
                  <span className="mt-1 block text-xs text-slate-400">Dica: Você pode cadastrar manualmente ou exportar/importar dados via API.</span>
                </>
              ) : (
                'Tente buscar por outro bloco, número ou observação.'
              )}
            </p>
            {units.length === 0 && !isFinancial && (
              <div className="mt-6 flex gap-3">
                <Button onClick={() => setWizardOpen(true)} variant="secondary" icon={<UploadCloud className="h-4 w-4" />}>
                  Importar Excel/PDF
                </Button>
                <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                  Cadastrar unidade
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="data-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Bloco</th>
                    <th>Status</th>
                    <th>Observações</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit) => (
                    <tr key={unit._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-[11px] font-black text-white shadow-sm">
                            {unit.number.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">Apt {unit.number}</p>
                            <p className="text-xs text-slate-400">ID {unit._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-700">{unit.block || '—'}</td>
                      <td><StatusBadge status={unit.status} /></td>
                      <td className="max-w-[200px] truncate text-slate-500">{unit.notes || 'Sem observações'}</td>
                      <td className="text-right">
                        {!isFinancial && (
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => isDemo ? blockAction() : openEdit(unit)}
                              className="icon-button hover:bg-blue-50 hover:text-blue-600"
                              title="Editar unidade"
                              aria-label={`Editar unidade ${unit.number}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => isDemo ? blockAction() : setDeleteTarget(unit)}
                              className="icon-button hover:bg-red-50 hover:text-red-500"
                              title="Excluir unidade"
                              aria-label={`Excluir unidade ${unit.number}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3.5 text-xs font-semibold text-slate-400">
              Mostrando <span className="font-bold text-slate-600">{filteredUnits.length}</span> de <span className="font-bold text-slate-600">{units.length}</span> unidades
            </div>
          </>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar unidade' : 'Nova unidade'}>
        <div className="space-y-4">
          <Input label="Bloco" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="A, B..." />
          <Input label="Número *" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="101..." />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[{ value: 'empty', label: 'Vazia' }, { value: 'occupied', label: 'Ocupada' }, { value: 'late', label: 'Inadimplente' }]} />
          <Input label="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir unidade?"
        description={`A unidade "${deleteTarget ? `${deleteTarget.block ? `Bloco ${deleteTarget.block} - ` : ''}Apt ${deleteTarget.number}` : 'selecionada'}" será removida. Se houver moradores ou registros vinculados, o sistema pode impedir a exclusão.`}
        confirmLabel="Excluir unidade"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ImportWizard 
        isOpen={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['units'] })} 
      />
    </PremiumPage>
  );
};

export default UnitsPage;
