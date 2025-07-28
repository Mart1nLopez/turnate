'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { MonthlyRevenue } from '@/services/dashboardService';
import { motion } from 'framer-motion';
import { TbTrendingUp, TbTrendingDown } from 'react-icons/tb';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthName: (() => {
      const [year, month] = item.month.split('-');
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    })(),
  }));

  // Calcular tendencia
  const hasData = data.some((item) => item.revenue > 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const lastMonthRevenue = data[data.length - 1]?.revenue || 0;
  const prevMonthRevenue = data[data.length - 2]?.revenue || 0;
  const trend = lastMonthRevenue >= prevMonthRevenue;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: { appointments: number };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 font-medium flex items-center">
              💰 Ingresos: {formatCurrency(payload[0].value)}
            </p>
            <p className="text-blue-600 font-medium flex items-center">📅 Citas: {payload[0].payload.appointments}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        <Card >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  Ingresos por Mes
                </CardTitle>
                <CardDescription>Evolución de tus ingresos en los últimos 6 meses</CardDescription>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <TbTrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg font-medium text-gray-900 mb-2">No hay datos de ingresos</p>
                <p className="text-sm text-gray-500">Completa algunas citas para ver tus ingresos mensuales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className=" shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                Ingresos por Mes
              </CardTitle>
              <CardDescription>Evolución de tus ingresos en los últimos 6 meses</CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {trend ?
                  <TbTrendingUp className="h-5 w-5 text-emerald-500" />
                : <TbTrendingDown className="h-5 w-5 text-red-500" />}
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  <div className="text-gray-500">Total</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="monthName"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(value) => (value === 0 ? '0' : `$${(value / 1000).toFixed(0)}k`)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, opacity: 0.8 }}
                  activeDot={{
                    r: 8,
                    stroke: '#3b82f6',
                    strokeWidth: 3,
                    fill: '#ffffff',
                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
