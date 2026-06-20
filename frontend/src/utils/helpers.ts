export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-BR');
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
  if (cleaned.length === 10) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
  return phone;
};

export const getUnitLabel = (unit: any): string => {
  if (!unit) return '-';
  if (typeof unit === 'string') return unit;
  const block = unit.block ? `Bloco ${unit.block} - ` : '';
  return `${block}Apt ${unit.number}`;
};

export const statusLabels: Record<string, string> = {
  pending: 'Pendente', paid: 'Pago', late: 'Atrasado',
  open: 'Aberta', in_progress: 'Em análise', resolved: 'Resolvida',
  approved: 'Aprovada', rejected: 'Recusada', cancelled: 'Cancelada',
  occupied: 'Ocupada', empty: 'Vazia',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  late: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  occupied: 'bg-green-100 text-green-800',
  empty: 'bg-gray-100 text-gray-800',
};

export const categoryLabels: Record<string, string> = {
  general: 'Geral', maintenance: 'Manutenção', assembly: 'Assembleia',
  security: 'Segurança', financial: 'Financeiro',
  noise: 'Barulho', cleaning: 'Limpeza', garage: 'Garagem',
  leak: 'Vazamento', other: 'Outro',
};

export const priorityLabels: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta',
};

export const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export const residentTypeLabels: Record<string, string> = {
  owner: 'Proprietário', tenant: 'Inquilino', financial_responsible: 'Responsável financeiro',
};

export const COMMON_AREAS = [
  'Salão de festas', 'Churrasqueira', 'Espaço gourmet', 'Quadra', 'Outra',
];

export const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const isValidCPF = (cpf: string): boolean => {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(cpf[10]);
};

const isValidCNPJ = (cnpj: string): boolean => {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (cn: string, weights: number[]) =>
    weights.reduce((acc, w, i) => acc + parseInt(cn[i]) * w, 0);
  const mod = (n: number) => { const r = n % 11; return r < 2 ? 0 : 11 - r; };
  return (
    mod(calc(cnpj, [5,4,3,2,9,8,7,6,5,4,3,2])) === parseInt(cnpj[12]) &&
    mod(calc(cnpj, [6,5,4,3,2,9,8,7,6,5,4,3,2])) === parseInt(cnpj[13])
  );
};

export const validatePixKey = (raw: string): { valid: boolean; error?: string } => {
  const key = raw.trim();
  if (!key) return { valid: true };
  const digits = key.replace(/\D/g, '');
  if (digits.length === 11 && /^\d[\d.\-]*\d$/.test(key)) {
    return isValidCPF(digits) ? { valid: true } : { valid: false, error: 'CPF inválido. Verifique os dígitos.' };
  }
  if (digits.length === 14 && /^\d[\d.\-\/]*\d$/.test(key)) {
    return isValidCNPJ(digits) ? { valid: true } : { valid: false, error: 'CNPJ inválido. Verifique os dígitos.' };
  }
  return { valid: true };
};

export const exportToCSV = (data: any[], filename: string, columns: { key: string; label: string; format?: (val: any) => string }[]) => {
  if (!data || !data.length) return;

  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(item =>
    columns.map(c => {
      let val = item[c.key];
      if (c.key.includes('.')) {
        val = c.key.split('.').reduce((acc, part) => acc && acc[part], item);
      }
      if (c.format) {
        val = c.format(val);
      }
      const safeVal = String(val ?? '').replace(/"/g, '""');
      return `"${safeVal}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
