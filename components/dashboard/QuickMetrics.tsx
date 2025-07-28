'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TbTrendingUp, TbTrendingDown, TbMinus } from 'react-icons/tb';

interface QuickMetricsProps {
  currentRevenue: number;
  previousRevenue: number;
  currentAppointments: number;
  previousAppointments: number;
}

export default function QuickMetrics({
  currentRevenue,
  previousRevenue,
  currentAppointments,
  previousAppointments,
}: QuickMetricsProps) {
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const appointmentsChange =
    previousAppointments > 0 ? ((currentAppointments - previousAppointments) / previousAppointments) * 100 : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return TbTrendingUp;
    if (change < 0) return TbTrendingDown;
    return TbMinus;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const metrics = [
    {
      label: 'Ingresos',
      value: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
      change: revenueChange,
      description: 'vs. mes anterior',
    },
    {
      label: 'Citas',
      value: `${appointmentsChange >= 0 ? '+' : ''}${appointmentsChange.toFixed(1)}%`,
      change: appointmentsChange,
      description: 'vs. mes anterior',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const TrendIcon = getTrendIcon(metric.change);
        const trendColor = getTrendColor(metric.change);

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className={`text-lg font-bold ${trendColor}`}>{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                  <div className={`p-2 rounded-full bg-gray-100`}>
                    <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
