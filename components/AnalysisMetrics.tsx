'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface AnalysisMetricsProps {
  metrics: Metric[];
}

export default function AnalysisMetrics({ metrics }: AnalysisMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="glass-effect rounded-xl p-5"
        >
          <div className="text-gemini-blue-300 text-sm mb-2">{metric.label}</div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            {metric.change !== undefined && (
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-400' :
                metric.trend === 'down' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                {metric.trend === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
                {Math.abs(metric.change)}%
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
