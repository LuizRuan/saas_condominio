import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PremiumPage from '../../components/ui/PremiumPage';
import MetricCard from '../../components/ui/MetricCard';
import { AlertTriangle, CheckCircle2, Copy, FileCheck2, QrCode, Receipt, Send, Upload, WalletCards } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import api from '../../services/api';
import { Charge, Condominium } from '../../types';
import toast from 'react-hot-toast';

const MyCharges: React.FC = () => {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [condo, setCondo] = useState<Condominium | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [c, co] = await Promise.all([api.get('/charges', { params: { limit: 200 } }), api.get('/condominiums/my')]);
      setCharges(c.data.data ?? c.data); setCondo(co.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  const copyPix = () => {
    if (condo?.pixKey) { navigator.clipboard.writeText(condo.pixKey); toast.success('Chave Pix copiada!'); }
  };

  const openPayment = (charge: Charge) => {
    setSelectedCharge(charge);
    setProofUrl('');
    setProofNote('');
    setPaymentOpen(true);
  };

  const paymentText = selectedCharge && condo?.pixKey
    ? `Pagamento Condomínio em Dia\nValor: ${formatCurrency(selectedCharge.amount)}\nReferência: ${selectedCharge.referenceMonth}\nChave Pix: ${condo.pixKey}`
    : '';

  const copyPaymentText = async () => {
    if (!paymentText) return;
    await navigator.clipboard.writeText(paymentText);
    toast.success('Dados de pagamento copiados!');
  };

  const handleProofFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Envie uma imagem do comprovante');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setProofUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submitProof = async () => {
    if (!selectedCharge) return;
    if (!proofUrl) {
      toast.error('Anexe uma foto do comprovante');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/charges/${selectedCharge._id}/proof`, { proofUrl, proofNote });
      toast.success('Comprovante enviado para análise!');
      setPaymentOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao enviar comprovante');
    } finally {
      setSaving(false);
    }
  };

  const filteredCharges = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return charges;

    return charges.filter((charge) => [
      charge.description,
      charge.referenceMonth,
      charge.status,
      formatDate(charge.dueDate),
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [charges, search]);

  const sumByStatus = (status: Charge['status']) => charges
    .filter((charge) => charge.status === status)
    .reduce((total, charge) => total + charge.amount, 0);

  if (loading) return <LoadingSpinner text="Carregando..." />;

  return (
    <PremiumPage
      title="Minhas Cobranças"
      subtitle="Acompanhe vencimentos, valores pendentes e chave Pix."
      onMenuClick={onMenuClick}
      eyebrow="Área do morador"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar cobranças..."
    >
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Cobranças" value={charges.length} helper="no total" icon={<Receipt className="h-4 w-4" />} />
        <MetricCard label="Pendentes" value={formatCurrency(sumByStatus('pending'))} helper="a pagar" icon={<WalletCards className="h-4 w-4" />} iconClass="bg-blue-100 text-blue-700" valueClassName="text-blue-700" />
        <MetricCard label="Pagas" value={formatCurrency(sumByStatus('paid'))} helper="quitadas" icon={<CheckCircle2 className="h-4 w-4" />} iconClass="bg-emerald-100 text-emerald-700" valueClassName="text-emerald-700" />
        <MetricCard label="Em atraso" value={formatCurrency(sumByStatus('late'))} helper="atenção" icon={<AlertTriangle className="h-4 w-4" />} iconClass="bg-red-100 text-red-700" valueClassName="text-red-600" />
        <MetricCard label="Em análise" value={charges.filter((charge) => charge.proofStatus === 'submitted').length} helper="comprovantes" icon={<FileCheck2 className="h-4 w-4" />} iconClass="bg-fuchsia-100 text-fuchsia-700" valueClassName="text-fuchsia-700" />
      </section>

      {condo?.pixKey && (
        <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-violet-100/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(76,29,149,0.07)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-violet-700">Pagamento via Pix</p>
            <p className="mt-2 break-all text-sm font-extrabold text-slate-950">{condo.pixKey}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Use esta chave para pagamentos e confira a baixa com a administração.</p>
          </div>
          <Button variant="secondary" onClick={copyPix} icon={<Copy className="h-4 w-4" />} className="self-start sm:self-auto">
            Copiar chave
          </Button>
        </section>
      )}

      <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 shadow-[0_18px_60px_rgba(76,29,149,0.07)]">
        <div className="border-b border-violet-100/80 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] text-slate-950">Lista de Cobranças</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {search ? `${filteredCharges.length} resultado(s) encontrados` : 'Histórico financeiro da sua unidade'}
          </p>
        </div>

        {filteredCharges.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
              <Receipt className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-slate-950">
              {charges.length === 0 ? 'Nenhuma cobrança disponível' : 'Nenhuma cobrança encontrada'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              {charges.length === 0 ? 'Você não possui cobranças no momento.' : 'Tente buscar por outro mês, status ou descrição.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-7 xl:grid-cols-2">
            {filteredCharges.map((charge) => (
              <article key={charge._id} className={`rounded-2xl border bg-white p-5 shadow-[0_14px_40px_rgba(76,29,149,0.05)] ${charge.status === 'late' ? 'border-red-200 ring-4 ring-red-50' : 'border-violet-100/80'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-extrabold tracking-[-0.03em] text-slate-950">{charge.description}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Ref. {charge.referenceMonth} · Vence {formatDate(charge.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black tracking-[-0.03em] text-slate-950">{formatCurrency(charge.amount)}</p>
                    <div className="mt-2"><StatusBadge status={charge.status} /></div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-violet-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className={`inline-flex self-start rounded-full px-3 py-1 text-[11px] font-black ${charge.proofStatus === 'submitted' ? 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-100' : charge.proofStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : charge.proofStatus === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100'}`}>
                    {charge.proofStatus === 'submitted' ? 'Comprovante em análise' : charge.proofStatus === 'approved' ? 'Comprovante aprovado' : charge.proofStatus === 'rejected' ? 'Comprovante rejeitado' : 'Sem comprovante'}
                  </span>
                  {charge.status !== 'paid' && (
                    <Button size="sm" onClick={() => openPayment(charge)} icon={<QrCode className="h-3.5 w-3.5" />} className="border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                      Pagar agora
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} title="Pagamento Pix" size="lg">
        {selectedCharge && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-violet-700 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Cobrança selecionada</p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">{formatCurrency(selectedCharge.amount)}</h3>
              <p className="mt-2 text-sm font-semibold text-violet-100">
                Ref. {selectedCharge.referenceMonth} · Vencimento {formatDate(selectedCharge.dueDate)}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="rounded-3xl border border-violet-100 bg-white p-4 text-center shadow-[0_18px_55px_rgba(76,29,149,0.08)]">
                {paymentText ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentText)}`}
                    alt="QR Code Pix"
                    className="mx-auto h-44 w-44 rounded-2xl"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <QrCode className="h-12 w-12" />
                  </div>
                )}
                <Button variant="secondary" size="sm" onClick={copyPaymentText} icon={<Copy className="h-3.5 w-3.5" />} className="mt-4 w-full">
                  Copiar Pix
                </Button>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-[#fbf8ff] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Enviar comprovante</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Após pagar, anexe uma foto do comprovante. O síndico recebe a notificação e faz a baixa.
                </p>
                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white p-5 text-center transition hover:border-violet-300 hover:bg-violet-50">
                  <Upload className="h-6 w-6 text-violet-700" />
                  <span className="mt-2 text-sm font-black text-slate-950">Selecionar foto</span>
                  <span className="mt-1 text-xs font-semibold text-slate-500">PNG ou JPG do comprovante</span>
                  <input type="file" accept="image/*" onChange={handleProofFile} className="hidden" />
                </label>
                {proofUrl && (
                  <img src={proofUrl} alt="Prévia do comprovante" className="mt-4 max-h-48 w-full rounded-2xl border border-violet-100 object-contain bg-white" />
                )}
              </div>
            </div>

            <Textarea
              label="Observação opcional"
              value={proofNote}
              onChange={(event) => setProofNote(event.target.value)}
              rows={3}
              placeholder="Ex.: pago pelo banco X, comprovante em nome de..."
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => setPaymentOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={submitProof} loading={saving} icon={<Send className="h-4 w-4" />} className="flex-1 border-violet-700 bg-violet-700 hover:border-violet-800 hover:bg-violet-800">
                Enviar comprovante
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PremiumPage>
  );
};

export default MyCharges;
