import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  loading = false,
  onClose,
  onConfirm,
}) => (
  <Modal isOpen={isOpen} onClose={loading ? () => undefined : onClose} title={title} size="sm">
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-violet-50 p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-red-100/70 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-sm ring-1 ring-red-200/70">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-3 w-3" />
              Ação irreversível
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} className="w-full sm:w-auto">
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
