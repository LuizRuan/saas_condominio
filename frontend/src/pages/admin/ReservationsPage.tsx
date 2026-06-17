import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import { Ban, CalendarDays, CheckCircle, Clock3, Lock, MapPin, Plus, Trash2, XCircle } from 'lucide-react';
import { COMMON_AREAS, formatDate, getUnitLabel } from '../../utils/helpers';
import api from '../../services/api';
import { Reservation, ReservationBlock, Unit } from '../../types';
import toast from 'react-hot-toast';

const ReservationsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [list, setList] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<ReservationBlock[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<ReservationBlock | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ unitId: '', area: '', date: '', startTime: '', endTime: '', notes: '' });
  const [blockForm, setBlockForm] = useState({ area: '', date: '', startTime: '', endTime: '', reason: '' });

  const load = async () => {
    try {
      const [reservationsResponse, unitsResponse, blocksResponse] = await Promise.all([
        api.get('/reservations'),
        api.get('/units'),
        api.get('/reservations/blocks/list'),
      ]);
      setList(reservationsResponse.data);
      setUnits(unitsResponse.data);
      setBlocks(blocksResponse.data);
    }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ unitId: '', area: '', date: '', startTime: '', endTime: '', notes: '' });
    setModalOpen(true);
  };

  const openBlock = () => {
    setBlockForm({ area: '', date: '', startTime: '', endTime: '', reason: '' });
    setBlockOpen(true);
  };

  const handleCreate = async () => {
    if (!form.unitId || !form.area || !form.date || !form.startTime || !form.endTime) {
      toast.error('Unidade, área, data e horários são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await api.post('/reservations', form);
      toast.success('Reserva criada!');
      setModalOpen(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleBlockCreate = async () => {
    if (!blockForm.area || !blockForm.date || !blockForm.startTime || !blockForm.endTime) {
      toast.error('Área, data e horários são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await api.post('/reservations/blocks', blockForm);
      toast.success('Horário bloqueado!');
      setBlockOpen(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const approve = async (id: string) => {
    try { await api.patch(`/reservations/${id}/approve`); toast.success('Aprovada!'); load(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
  };
  const reject = async (id: string) => {
    try { await api.patch(`/reservations/${id}/reject`); toast.success('Recusada!'); load(); }
    catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget._id;
    setSaving(true);
    try {
      await api.delete(`/reservations/${deletedId}`);
      toast.success('Reserva excluída!');
      setDeleteTarget(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDeleteBlock = async () => {
    if (!deleteBlockTarget) return;
    setSaving(true);
    try {
      await api.delete(`/reservations/blocks/${deleteBlockTarget._id}`);
      toast.success('Bloqueio removido!');
      setDeleteBlockTarget(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;

    return list.filter((reservation) => [
      reservation.area,
      getUnitLabel(reservation.unitId),
      reservation.date,
      reservation.status,
      reservation.notes,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [list, search]);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Reservas"
      subtitle="Analise solicitações de áreas comuns com clareza e rapidez."
      onMenuClick={onMenuClick}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar reservas, áreas..."
      actions={(
        <>
          <Button variant="secondary" onClick={openBlock} icon={<Lock className="h-4 w-4" />} className="w-full sm:w-auto">
            Bloquear horário
          </Button>
          <Button
            onClick={openCreate}
            icon={<Plus className="h-4 w-4" />}
            className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto"
          >
            Nova reserva
          </Button>
        </>
      )}
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Reservas" value={list.length} helper="solicitações" icon={<CalendarDays className="h-4 w-4" />} />
        <MetricCard label="Pendentes" value={list.filter((item) => item.status === 'pending').length} helper="para análise" icon={<Clock3 className="h-4 w-4" />} iconClass="bg-violet-100 text-violet-700" />
        <MetricCard label="Aprovadas" value={list.filter((item) => item.status === 'approved').length} helper="confirmadas" icon={<CheckCircle className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
        <MetricCard label="Recusadas" value={list.filter((item) => item.status === 'rejected').length} helper="negadas" icon={<XCircle className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
        <MetricCard label="Bloqueios" value={blocks.length} helper="agenda travada" icon={<Ban className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-700" />
      </section>

      {blocks.length > 0 && (
        <section className="mt-7 rounded-2xl border border-violet-100/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(76,29,149,0.07)] sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">Agenda</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">Horários bloqueados</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={openBlock} icon={<Lock className="h-3.5 w-3.5" />}>Novo bloqueio</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {blocks.slice(0, 6).map((block) => (
              <article key={block._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{block.area}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(block.date)} · {block.startTime} - {block.endTime}</p>
                    {block.reason && <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{block.reason}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteBlockTarget(block)}
                    className="icon-button shrink-0 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                    title="Remover bloqueio"
                    aria-label={`Remover bloqueio de ${block.area}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Lista de Reservas</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {search ? `${filteredReservations.length} resultado(s) encontrados` : 'Solicitações de uso das áreas comuns'}
          </p>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {list.length === 0 ? 'Nenhuma reserva encontrada' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {list.length === 0 ? 'Crie uma reserva interna ou acompanhe as solicitações dos moradores por aqui.' : 'Tente buscar por outra área, unidade ou data.'}
            </p>
            {list.length === 0 && (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />} className="mt-6 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Criar reserva
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
            {filteredReservations.map((reservation) => (
              <article key={reservation._id} className="rounded-2xl border border-violet-100/80 bg-white p-5 shadow-[0_14px_40px_rgba(76,29,149,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(76,29,149,0.08)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={reservation.status} />
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                        <MapPin className="h-3.5 w-3.5" />
                        {getUnitLabel(reservation.unitId)}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold tracking-[-0.03em] text-slate-950">{reservation.area}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatDate(reservation.date)} · {reservation.startTime} - {reservation.endTime}
                    </p>
                    {reservation.notes && <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-600">{reservation.notes}</p>}
                  </div>
                  {reservation.status === 'pending' && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" variant="success" onClick={() => approve(reservation._id)} icon={<CheckCircle className="h-3.5 w-3.5" />}>Aprovar</Button>
                      <Button size="sm" variant="danger" onClick={() => reject(reservation._id)} icon={<XCircle className="h-3.5 w-3.5" />}>Recusar</Button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(reservation)}
                    className="icon-button shrink-0 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                    title="Excluir reserva"
                    aria-label={`Excluir reserva ${reservation.area}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova reserva" size="lg">
        <div className="space-y-4">
          <Select
            label="Unidade *"
            value={form.unitId}
            onChange={(e) => setForm({ ...form, unitId: e.target.value })}
            options={units.map((unit) => ({
              value: unit._id,
              label: `${unit.block ? `Bloco ${unit.block} - ` : ''}Apt ${unit.number}`,
            }))}
            placeholder="Selecione a unidade"
          />
          <Select
            label="Área *"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            options={COMMON_AREAS.map((area) => ({ value: area, label: area }))}
            placeholder="Selecione a área"
          />
          <Input label="Data *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Hora início *" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="Hora fim *" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Textarea label="Observação" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Detalhes úteis para a reserva..." />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Criar reserva</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={blockOpen} onClose={() => setBlockOpen(false)} title="Bloquear horário" size="lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-100 bg-[#fbf8ff] p-4">
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Use bloqueios para manutenção, eventos internos ou períodos indisponíveis. Moradores não conseguirão reservar nesse intervalo.
            </p>
          </div>
          <Select
            label="Área *"
            value={blockForm.area}
            onChange={(e) => setBlockForm({ ...blockForm, area: e.target.value })}
            options={COMMON_AREAS.map((area) => ({ value: area, label: area }))}
            placeholder="Selecione a área"
          />
          <Input label="Data *" type="date" value={blockForm.date} onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Hora início *" type="time" value={blockForm.startTime} onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })} />
            <Input label="Hora fim *" type="time" value={blockForm.endTime} onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })} />
          </div>
          <Textarea label="Motivo" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} rows={3} placeholder="Ex.: manutenção da churrasqueira..." />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setBlockOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleBlockCreate} loading={saving} className="flex-1">Bloquear agenda</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir reserva?"
        description={`A reserva de "${deleteTarget?.area || 'área comum'}" em ${deleteTarget ? formatDate(deleteTarget.date) : 'data selecionada'} será removida do histórico. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir reserva"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteBlockTarget)}
        title="Remover bloqueio?"
        description={`O bloqueio de "${deleteBlockTarget?.area || 'área comum'}" em ${deleteBlockTarget ? formatDate(deleteBlockTarget.date) : 'data selecionada'} deixará de impedir novas reservas.`}
        confirmLabel="Remover bloqueio"
        loading={saving}
        onClose={() => setDeleteBlockTarget(null)}
        onConfirm={handleDeleteBlock}
      />
    </PremiumPage>
  );
};

export default ReservationsPage;
