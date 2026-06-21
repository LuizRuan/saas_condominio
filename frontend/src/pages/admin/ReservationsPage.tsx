import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import {
  AlertTriangle, Ban, CalendarDays, CheckCircle, ChevronLeft, ChevronRight,
  Clock3, Lock, Plus, Trash2, XCircle,
} from 'lucide-react';
import { COMMON_AREAS, getUnitLabel } from '../../utils/helpers';
import api from '../../services/api';
import { Reservation, ReservationBlock, Unit } from '../../types';
import toast from 'react-hot-toast';
import { useDemo } from '../../contexts/DemoContext';
import { useAuth } from '../../contexts/AuthContext';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DAY_ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const fmtDay = (dayStr: string): string => {
  const [y, m, d] = dayStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
};

const fmtShort = (dayStr: string): string => {
  const [y, m, d] = dayStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
};

const toArr = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  const r = raw as any;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.items)) return r.items;
  return [];
};

const timeOverlap = (s1: string, e1: string, s2: string, e2: string) =>
  s1 < e2 && s2 < e1;

const ReservationsPage: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { isDemo, blockAction } = useDemo();
  const { isAdmin, isResident } = useAuth();

  const canBlock = !isResident;
  const canApprove = isAdmin;

  // Data state
  const [list, setList] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<ReservationBlock[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<ReservationBlock | null>(null);

  // Form state (date injected from selectedDay at submit time)
  const [form, setForm] = useState({ unitId: '', area: '', startTime: '', endTime: '', notes: '' });
  const [blockForm, setBlockForm] = useState({ area: '', startTime: '', endTime: '', reason: '' });

  // Calendar state
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [panelMode, setPanelMode] = useState<'view' | 'create' | 'block'>('view');

  const load = async () => {
    try {
      const [res, unitsRes, blocksRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/units'),
        api.get('/reservations/blocks/list'),
      ]);
      setList(toArr<Reservation>(res.data));
      setUnits(toArr<Unit>(unitsRes.data));
      setBlocks(toArr<ReservationBlock>(blocksRes.data));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Calendar computed
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    list.forEach(r => {
      const key = (r.date || '').slice(0, 10);
      if (key) { if (!map.has(key)) map.set(key, []); map.get(key)!.push(r); }
    });
    return map;
  }, [list]);

  const blocksByDay = useMemo(() => {
    const map = new Map<string, ReservationBlock[]>();
    blocks.forEach(b => {
      const key = (b.date || '').slice(0, 10);
      if (key) { if (!map.has(key)) map.set(key, []); map.get(key)!.push(b); }
    });
    return map;
  }, [blocks]);

  const selectedDayReservations = useMemo(
    () => reservationsByDay.get(selectedDay) ?? [],
    [reservationsByDay, selectedDay],
  );
  const selectedDayBlocks = useMemo(
    () => blocksByDay.get(selectedDay) ?? [],
    [blocksByDay, selectedDay],
  );

  const conflictError = useMemo(() => {
    if (!form.area || !form.startTime || !form.endTime || form.startTime >= form.endTime) return null;
    const hasBlock = selectedDayBlocks.some(b =>
      b.area === form.area && timeOverlap(form.startTime, form.endTime, b.startTime, b.endTime)
    );
    if (hasBlock) return 'Este horário já está reservado ou bloqueado para esta área.';
    const hasConflict = selectedDayReservations.some(r =>
      r.area === form.area && r.status === 'approved' &&
      timeOverlap(form.startTime, form.endTime, r.startTime, r.endTime)
    );
    if (hasConflict) return 'Este horário já está reservado ou bloqueado para esta área.';
    return null;
  }, [form.area, form.startTime, form.endTime, selectedDayBlocks, selectedDayReservations]);

  // Actions
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
    setSaving(true);
    try {
      await api.delete(`/reservations/${deleteTarget._id}`);
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

  const handlePanelCreate = async () => {
    if (!form.unitId || !form.area || !form.startTime || !form.endTime) {
      toast.error('Unidade, área e horários são obrigatórios');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('Hora fim deve ser maior que hora início');
      return;
    }
    const hasBlockConflict = selectedDayBlocks.some(b =>
      b.area === form.area && timeOverlap(form.startTime, form.endTime, b.startTime, b.endTime)
    );
    if (hasBlockConflict) {
      toast.error('Este horário está bloqueado para esta área');
      return;
    }
    const hasResConflict = selectedDayReservations.some(r =>
      r.area === form.area && r.status === 'approved' &&
      timeOverlap(form.startTime, form.endTime, r.startTime, r.endTime)
    );
    if (hasResConflict) {
      toast.error('Já existe uma reserva aprovada neste horário para esta área');
      return;
    }
    setSaving(true);
    try {
      await api.post('/reservations', { ...form, date: selectedDay });
      toast.success('Reserva criada!');
      setPanelMode('view');
      setForm({ unitId: '', area: '', startTime: '', endTime: '', notes: '' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handlePanelBlockCreate = async () => {
    if (!blockForm.area || !blockForm.startTime || !blockForm.endTime) {
      toast.error('Área e horários são obrigatórios');
      return;
    }
    if (blockForm.startTime >= blockForm.endTime) {
      toast.error('Hora fim deve ser maior que hora início');
      return;
    }
    setSaving(true);
    try {
      await api.post('/reservations/blocks', { ...blockForm, date: selectedDay });
      toast.success('Horário bloqueado!');
      setPanelMode('view');
      setBlockForm({ area: '', startTime: '', endTime: '', reason: '' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleDayClick = (dayStr: string) => {
    setSelectedDay(dayStr);
    setPanelMode('view');
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const openCreatePanel = () => {
    setForm({ unitId: '', area: '', startTime: '', endTime: '', notes: '' });
    setPanelMode('create');
  };
  const openBlockPanel = () => {
    setBlockForm({ area: '', startTime: '', endTime: '', reason: '' });
    setPanelMode('block');
  };

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Reservas"
      subtitle="Agenda interativa de áreas comuns e solicitações dos moradores."
      onMenuClick={onMenuClick}
      actions={(
        <>
          {canBlock && (
            <Button
              variant="secondary"
              onClick={isDemo ? blockAction : openBlockPanel}
              icon={<Lock className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Bloquear horário
            </Button>
          )}
          <Button
            onClick={isDemo ? blockAction : openCreatePanel}
            icon={<Plus className="h-4 w-4" />}
            className="w-full rounded-xl border-violet-700 bg-violet-700 shadow-violet-700/20 hover:border-violet-800 hover:bg-violet-800 sm:w-auto"
          >
            Nova reserva
          </Button>
        </>
      )}
    >
      {/* Metric Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Reservas" value={list.length} helper="solicitações" icon={<CalendarDays className="h-4 w-4" />} />
        <MetricCard label="Pendentes" value={list.filter(i => i.status === 'pending').length} helper="para análise" icon={<Clock3 className="h-4 w-4" />} iconClass="bg-violet-100 text-violet-700" />
        <MetricCard label="Aprovadas" value={list.filter(i => i.status === 'approved').length} helper="confirmadas" icon={<CheckCircle className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
        <MetricCard label="Recusadas" value={list.filter(i => i.status === 'rejected').length} helper="negadas" icon={<XCircle className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
        <MetricCard label="Bloqueios" value={blocks.length} helper="agenda travada" icon={<Ban className="h-4 w-4" />} iconClass="bg-slate-100 text-slate-700" />
      </section>

      {/* Calendar + Side Panel */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_400px]">

        {/* Calendar */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-900">
              {MONTH_NAMES[calMonth]} {calYear}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-50 px-2 pt-2">
            {DAY_ABBRS.map(d => (
              <div key={d} className="pb-1 text-center text-[10px] font-black uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid — key triggers animate-scale-in on month change */}
          <div key={`${calYear}-${calMonth}`} className="animate-scale-in grid grid-cols-7 gap-0.5 p-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayRes = reservationsByDay.get(dayStr) ?? [];
              const dayBlocks = blocksByDay.get(dayStr) ?? [];
              const isSelected = dayStr === selectedDay;
              const isToday = dayStr === todayStr;
              const hasApproved = dayRes.some(r => r.status === 'approved');
              const hasPending = dayRes.some(r => r.status === 'pending');
              const hasBlock = dayBlocks.length > 0;
              const activeCount = dayRes.filter(r => r.status !== 'rejected' && r.status !== 'cancelled').length + dayBlocks.length;

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => handleDayClick(dayStr)}
                  className={[
                    'relative flex min-h-[30px] flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/25'
                      : 'text-slate-700 hover:bg-violet-50',
                    isToday && !isSelected ? 'ring-2 ring-violet-300 ring-offset-1' : '',
                  ].join(' ')}
                >
                  <span className={`text-xs font-black leading-none ${isSelected ? 'text-white' : isToday ? 'text-violet-700' : 'text-slate-800'}`}>
                    {dayNum}
                  </span>
                  {(hasApproved || hasPending || hasBlock) && (
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {hasApproved && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                      )}
                      {hasPending && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-yellow-200' : 'bg-amber-400'}`} />
                      )}
                      {hasBlock && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
                      )}
                    </div>
                  )}
                  {activeCount > 1 && (
                    <span className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-slate-400">Aprovada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold text-slate-400">Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold text-slate-400">Bloqueio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-2 ring-violet-300" />
              <span className="text-[11px] font-semibold text-slate-400">Hoje</span>
            </div>
          </div>
        </section>

        {/* Side Panel */}
        <aside className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* Panel header */}
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold capitalize text-slate-900">
                  {fmtDay(selectedDay)}
                </h2>
                <p className="text-xs font-medium text-slate-400">
                  {selectedDayReservations.length} reserva(s) · {selectedDayBlocks.length} bloqueio(s)
                </p>
              </div>
            </div>
          </div>

          {/* Panel body */}
          <div className="overflow-y-auto" style={{ maxHeight: '560px' }}>

            {/* VIEW MODE */}
            {panelMode === 'view' && (
              <div className="space-y-3 p-4">

                {/* Block entries */}
                {selectedDayBlocks.map(block => (
                  <div key={block._id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-red-700">
                          <Ban className="h-3.5 w-3.5 shrink-0" />
                          Bloqueio — {block.area}
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-red-600">
                          {block.startTime} – {block.endTime}
                        </p>
                        {block.reason && (
                          <p className="mt-1 text-xs text-red-500">{block.reason}</p>
                        )}
                        {(block.createdBy as any)?.name && (
                          <p className="mt-1 text-[10px] font-semibold text-red-400">
                            Por: {(block.createdBy as any).name}
                          </p>
                        )}
                      </div>
                      {canBlock && (
                        <button
                          type="button"
                          onClick={() => setDeleteBlockTarget(block)}
                          className="shrink-0 rounded-lg p-1 text-red-300 transition hover:bg-red-100 hover:text-red-600"
                          title="Remover bloqueio"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Reservation entries */}
                {selectedDayReservations.map(r => (
                  <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <StatusBadge status={r.status} />
                        <p className="mt-1.5 truncate text-sm font-bold text-slate-800">{r.area}</p>
                        <p className="text-xs font-semibold text-slate-500">{r.startTime} – {r.endTime}</p>
                        <p className="text-xs text-slate-400">{getUnitLabel(r.unitId)}</p>
                        {r.notes && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.notes}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {r.status === 'pending' && canApprove && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => isDemo ? blockAction() : approve(r._id)}
                              icon={<CheckCircle className="h-3 w-3" />}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => isDemo ? blockAction() : reject(r._id)}
                              icon={<XCircle className="h-3 w-3" />}
                            >
                              Recusar
                            </Button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => isDemo ? blockAction() : setDeleteTarget(r)}
                          className="rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                          title="Excluir reserva"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {selectedDayReservations.length === 0 && selectedDayBlocks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-600">Nenhuma reserva</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      Nenhuma atividade para este dia.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => isDemo ? blockAction() : openCreatePanel()}
                    icon={<Plus className="h-4 w-4" />}
                    className="w-full border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800"
                  >
                    Nova reserva
                  </Button>
                  {canBlock && (
                    <Button
                      variant="secondary"
                      onClick={() => isDemo ? blockAction() : openBlockPanel()}
                      icon={<Lock className="h-4 w-4" />}
                      className="w-full"
                    >
                      Bloquear horário
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* CREATE MODE */}
            {panelMode === 'create' && (
              <div className="space-y-3 p-4">
                <button
                  type="button"
                  onClick={() => setPanelMode('view')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-violet-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Voltar
                </button>
                <h3 className="text-sm font-extrabold text-slate-900">Nova reserva</h3>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span className="text-xs font-semibold capitalize text-slate-600">{fmtDay(selectedDay)}</span>
                </div>

                {selectedDayBlocks.length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Bloqueios ativos neste dia:
                    </p>
                    {selectedDayBlocks.map(b => (
                      <p key={b._id} className="mt-0.5 text-xs text-amber-600">
                        · {b.area}: {b.startTime}–{b.endTime}
                      </p>
                    ))}
                  </div>
                )}

                <Select
                  label="Unidade *"
                  value={form.unitId}
                  onChange={e => setForm({ ...form, unitId: e.target.value })}
                  options={units.map(u => ({ value: u._id, label: getUnitLabel(u) }))}
                  placeholder="Selecione a unidade"
                />
                <Select
                  label="Área *"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  options={COMMON_AREAS.map(a => ({ value: a, label: a }))}
                  placeholder="Selecione a área"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Início *"
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                  />
                  <Input
                    label="Fim *"
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
                {conflictError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <p className="text-xs font-semibold text-red-600">{conflictError}</p>
                  </div>
                )}
                <Textarea
                  label="Observação"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Detalhes úteis..."
                />
                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" onClick={() => setPanelMode('view')} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePanelCreate}
                    loading={saving}
                    disabled={!!conflictError}
                    className="flex-1"
                  >
                    Criar
                  </Button>
                </div>
              </div>
            )}

            {/* BLOCK MODE */}
            {panelMode === 'block' && (
              <div className="space-y-3 p-4">
                <button
                  type="button"
                  onClick={() => setPanelMode('view')}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-violet-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Voltar
                </button>
                <h3 className="text-sm font-extrabold text-slate-900">Bloquear horário</h3>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span className="text-xs font-semibold capitalize text-slate-600">{fmtDay(selectedDay)}</span>
                </div>

                <div className="rounded-xl border border-violet-100 bg-[#fbf8ff] p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    Moradores não conseguirão reservar durante este intervalo.
                  </p>
                </div>

                <Select
                  label="Área *"
                  value={blockForm.area}
                  onChange={e => setBlockForm({ ...blockForm, area: e.target.value })}
                  options={COMMON_AREAS.map(a => ({ value: a, label: a }))}
                  placeholder="Selecione a área"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Início *"
                    type="time"
                    value={blockForm.startTime}
                    onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })}
                  />
                  <Input
                    label="Fim *"
                    type="time"
                    value={blockForm.endTime}
                    onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })}
                  />
                </div>
                <Textarea
                  label="Motivo"
                  value={blockForm.reason}
                  onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                  rows={2}
                  placeholder="Ex.: manutenção da churrasqueira..."
                />
                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" onClick={() => setPanelMode('view')} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handlePanelBlockCreate} loading={saving} className="flex-1">
                    Bloquear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir reserva?"
        description={`A reserva de "${deleteTarget?.area || 'área comum'}" em ${deleteTarget ? fmtShort(deleteTarget.date.slice(0, 10)) : 'data selecionada'} será removida. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir reserva"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteBlockTarget)}
        title="Remover bloqueio?"
        description={`O bloqueio de "${deleteBlockTarget?.area || 'área comum'}" em ${deleteBlockTarget ? fmtShort(deleteBlockTarget.date.slice(0, 10)) : 'data selecionada'} deixará de impedir novas reservas.`}
        confirmLabel="Remover bloqueio"
        loading={saving}
        onClose={() => setDeleteBlockTarget(null)}
        onConfirm={handleDeleteBlock}
      />
    </PremiumPage>
  );
};

export default ReservationsPage;
