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
import { AlertTriangle, Building2, CheckCircle2, Home, Pencil, Plus, Trash2, UploadCloud, Users } from 'lucide-react';
import api from '../../services/api';
import { Unit, Resident } from '../../types';

const toArr = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  const r = raw as any;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.items)) return r.items;
  return [];
};

const typeLabel = (type: Resident['type']) =>
  type === 'owner' ? 'Proprietário' : type === 'tenant' ? 'Inquilino' : 'Resp. financeiro';
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
  const [residentsModalUnit, setResidentsModalUnit] = useState<Unit | null>(null);

  const { data: residentsRaw } = useQuery<Resident[]>({
    queryKey: ['residents'],
    queryFn: async () => { try { const { data } = await api.get('/residents'); return toArr<Resident>(data); } catch { return []; } },
  });
  const allResidents: Resident[] = residentsRaw ?? [];

  const residentsByUnit = useMemo(() => {
    const map = new Map<string, Resident[]>();
    allResidents.forEach(r => {
      const uid = typeof r.unitId === 'string' ? r.unitId : (r.unitId as any)?._id;
      if (!uid) return;
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid)!.push(r);
    });
    return map;
  }, [allResidents]);

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
                    <th>Morador responsável</th>
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
                      <td>
                        {(() => {
                          const residents = residentsByUnit.get(unit._id) ?? [];
                          const owner = residents.find(r => r.type === 'owner') ?? residents[0];
                          if (!owner) return <span className="text-xs text-slate-400">Sem morador vinculado</span>;
                          const others = residents.length - 1;
                          return (
                            <button
                              type="button"
                              onClick={() => setResidentsModalUnit(unit)}
                              className="text-left text-sm font-semibold text-slate-800 hover:text-violet-700 transition-colors"
                            >
                              {owner.name}
                              {others > 0 && (
                                <span className="ml-1.5 text-xs font-bold text-violet-500">+{others}</span>
                              )}
                            </button>
                          );
                        })()}
                      </td>
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

      <Modal
        isOpen={Boolean(residentsModalUnit)}
        onClose={() => setResidentsModalUnit(null)}
        title="Integrantes da Unidade"
      >
        {residentsModalUnit && (() => {
          const residents = residentsByUnit.get(residentsModalUnit._id) ?? [];
          return (
            <div>
              <p className="mb-4 text-sm font-semibold text-slate-500">
                {residentsModalUnit.block ? `Bloco ${residentsModalUnit.block} · ` : ''}Unidade {residentsModalUnit.number}
              </p>
              {residents.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-slate-400">
                  <Users className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhum integrante vinculado a esta unidade.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {residents.map(r => (
                    <li key={r._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-sm font-black">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{r.name}</p>
                          <p className="text-xs font-semibold text-violet-600">{typeLabel(r.type)}</p>
                        </div>
                      </div>
                      {(r.email || r.phone) && (
                        <div className="mt-2 space-y-0.5 pl-12 text-xs text-slate-500">
                          {r.email && <p>{r.email}</p>}
                          {r.phone && <p>{r.phone}</p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </Modal>
    </PremiumPage>
  );
};

export default UnitsPage;
