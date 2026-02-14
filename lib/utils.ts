// Utility functions for the Drishti Agent application

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };
  return colors[severity] || 'text-gray-400';
};

export const getSeverityBgColor = (severity: string): string => {
  const colors: Record<string, string> = {
    low: 'bg-green-500/20',
    medium: 'bg-yellow-500/20',
    high: 'bg-orange-500/20',
    critical: 'bg-red-500/20',
  };
  return colors[severity] || 'bg-gray-500/20';
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateImprovementPercentage = (current: number, projected: number): number => {
  if (current === 0) return 0;
  return ((projected - current) / current) * 100;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateGradient = (index: number): string => {
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-blue-500',
  ];
  return gradients[index % gradients.length];
};
