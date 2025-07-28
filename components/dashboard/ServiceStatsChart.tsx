'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ServiceStats } from '@/services/dashboardService';
import { motion } from 'framer-motion';
import { TbChartPie } from 'react-icons/tb';

interface ServiceStatsChartProps {
  data: ServiceStats[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export default function ServiceStatsChart({ data }: ServiceStatsChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const totalAppointments = chartData.reduce((sum, item) => sum + item.appointments, 0);
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: ServiceStats & { color: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color }} />
            <p className="font-semibold text-gray-900">{data.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-blue-600 font-medium flex items-center">
              📅 Citas: {data.appointments} ({data.percentage.toFixed(1)}%)
            </p>
            <p className="text-emerald-600 font-medium flex items-center">
              💰 Ingresos: {formatCurrency(data.revenue)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (percent < 0.08) return null; // Solo mostrar etiquetas para sectores >= 8%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={13}
        fontWeight="bold"
        filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  Servicios por Ocupación
                </CardTitle>
                <CardDescription>Distribución de citas por servicio</CardDescription>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <TbChartPie className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-80 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</p>
                <p className="text-sm text-gray-500">Completa algunas citas para ver estadísticas por servicio</p>
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
      transition={{ duration: 0.5, delay: 0.4 }}>
      <Card className=" shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                Servicios por Ocupación
              </CardTitle>
              <CardDescription>Distribución de citas por servicio</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{totalAppointments} citas</div>
                <div className="text-gray-500">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={110}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="appointments"
                  animationBegin={0}
                  animationDuration={1000}
                  strokeWidth={2}
                  stroke="#ffffff">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
