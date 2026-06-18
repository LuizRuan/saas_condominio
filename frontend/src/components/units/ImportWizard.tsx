import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  status: string;
  message: string;
  block: string;
  number: string;
  residentName: string;
  phone: string;
  email: string;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setIsProcessing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStep(2);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/import/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParsedData(data.data);
      setStep(3);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao processar arquivo.');
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    setIsProcessing(true);
    try {
      const { data } = await api.post('/import/confirm', { rows: parsedData });
      toast.success(data.message || 'Importação concluída com sucesso!');
      onSuccess();
      handleClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao salvar os dados.');
      setIsProcessing(false);
    }
  };

  const handleRowChange = (index: number, field: keyof ParsedRow, value: string) => {
    const newData = [...parsedData];
    newData[index] = { ...newData[index], [field]: value };
    // Re-validate basic fields
    if (field === 'number') {
      if (!value.trim()) {
        newData[index].status = 'Campo obrigatório faltando';
        newData[index].message = 'Número da unidade é obrigatório.';
      } else {
        newData[index].status = 'Pronto';
        newData[index].message = '';
      }
    }
    setParsedData(newData);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importação Inteligente">
      <div className="flex flex-col h-[70vh] max-h-[600px] w-full max-w-4xl bg-white">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
            <span className={`text-sm font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Upload</span>
          </div>
          <div className="h-px flex-1 bg-slate-100 mx-4" />
          <div className="flex items-center space-x-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
            <span className={`text-sm font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Processamento</span>
          </div>
          <div className="h-px flex-1 bg-slate-100 mx-4" />
          <div className="flex items-center space-x-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</span>
            <span className={`text-sm font-semibold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>Revisão e Confirmação</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div 
              className="group relative flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 transition-colors hover:border-violet-500 hover:bg-violet-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="rounded-full bg-violet-100 p-4 text-violet-600 group-hover:bg-violet-200 group-hover:text-violet-700">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">Selecione o arquivo</h3>
              <p className="mt-2 text-center text-sm font-medium text-slate-500 max-w-sm">
                Envie uma planilha Excel (.xlsx, .csv) ou um PDF. A nossa inteligência vai estruturar blocos, unidades e moradores.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv,.pdf" 
                onChange={handleFileChange}
              />

              {file && (
                <div className="mt-6 flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  <FileType className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">{file.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-start gap-2 max-w-xl rounded-lg bg-blue-50 p-4 text-blue-800">
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Dica de formatação para Excel</p>
                <p className="mt-1 opacity-90">O sistema procura automaticamente por colunas como "Apto", "Bloco", "Nome do Morador" e "Telefone". Não se preocupe com a ordem exata.</p>
                <p className="mt-2 text-xs font-semibold">Nota: PDFs podem exigir revisão manual após a leitura.</p>
              </div>
            </div>
            
            <div className="mt-auto pt-6 flex justify-end w-full">
              <Button disabled={!file} onClick={processFile}>
                Processar arquivo
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-violet-600"></div>
            <h3 className="mt-6 text-lg font-bold text-slate-800">Lendo e estruturando dados...</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">
              Nossa inteligência está identificando blocos, apartamentos e vinculando moradores automaticamente. Isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4">
              <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">Unidades lidas</p>
                <p className="text-lg font-bold text-slate-900">{parsedData.length}</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">Moradores vinculados</p>
                <p className="text-lg font-bold text-slate-900">{parsedData.filter(d => d.residentName).length}</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-red-200">
                <p className="text-xs font-medium text-slate-500 text-red-600">Precisam revisão</p>
                <p className="text-lg font-bold text-red-700">{parsedData.filter(d => d.status !== 'Pronto').length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full min-w-[800px] text-left text-sm text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Bloco</th>
                    <th className="px-4 py-3 font-semibold">Unidade</th>
                    <th className="px-4 py-3 font-semibold">Morador</th>
                    <th className="px-4 py-3 font-semibold">Telefone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className={row.status === 'Pronto' ? '' : 'bg-red-50/50'}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          {row.status === 'Pronto' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-semibold ${row.status === 'Pronto' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {row.status}
                          </span>
                        </div>
                        {row.message && <p className="mt-1 text-[11px] text-red-600 font-medium">{row.message}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={row.block} 
                          onChange={(e) => handleRowChange(idx, 'block', e.target.value)} 
                          className="!py-1.5 !text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={row.number} 
                          onChange={(e) => handleRowChange(idx, 'number', e.target.value)} 
                          className={`!py-1.5 !text-sm ${!row.number ? 'ring-2 ring-red-400' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={row.residentName} 
                          onChange={(e) => handleRowChange(idx, 'residentName', e.target.value)} 
                          className="!py-1.5 !text-sm"
                          placeholder="Vazio..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={row.phone} 
                          onChange={(e) => handleRowChange(idx, 'phone', e.target.value)} 
                          className="!py-1.5 !text-sm"
                          placeholder="Vazio..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 p-6 flex justify-between bg-white">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isProcessing}>
                Voltar e reenviar
              </Button>
              <Button 
                onClick={confirmImport} 
                disabled={isProcessing || parsedData.filter(d => d.status !== 'Pronto').length > 0}
              >
                {isProcessing ? 'Salvando...' : 'Confirmar Importação'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default ImportWizard;
