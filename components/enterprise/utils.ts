export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value || 0));
};

export const formatDate = (value: string | number | Date): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

export const safeCount = (value: unknown): number => {
  return Array.isArray(value) ? value.length : 0;
};