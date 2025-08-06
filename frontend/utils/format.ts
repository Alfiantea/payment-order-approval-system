import type { PaymentOrderStatus } from '~backend/payment/types';

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getStatusColor(status: PaymentOrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'paid':
      return 'default';
    default:
      return 'outline';
  }
}
