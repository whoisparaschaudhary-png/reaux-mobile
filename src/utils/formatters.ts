import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date?: string | null) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy');
};
export const formatDateTime = (date?: string | null) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy HH:mm');
};
export const formatRelative = (date?: string | null) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return formatDistanceToNow(d, { addSuffix: true });
};
export const formatCurrency = (amount: number) => `₹${(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
export const formatNumber = (num: number) => {
  if (num == null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};
