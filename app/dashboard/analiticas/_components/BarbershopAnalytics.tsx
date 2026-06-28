'use client';

import { useState, useMemo } from 'react';
import {
  TbCalendar,
  TbUsers,
  TbCurrencyDollar,
  TbStar,
  TbScissors,
  TbCrown,
  TbChevronUp,
  TbChevronDown,
  TbUser,
  TbRepeat,
  TbX,
  TbBuildingStore,
  TbChartBar,
  TbAlertTriangle,
  TbClock,
  TbShieldCheck,
} from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarbershopAnalyticsData } from '@/services/barbershopAnalyticsService';
import { BarbershopMemberStatsRow } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, imageUrl, size = 'sm' }: { name: string; imageUrl: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-12 w-12 text-base' : 'h-8 w-8 text-xs';
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${dim} rounded-full object-cover border border-gray-200 flex-shrink-0`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: 'owner' | 'admin' | 'barber' }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <TbCrown className="h-3 w-3" />
        Dueño
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <TbShieldCheck className="h-3 w-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <TbScissors className="h-3 w-3" />
      Barbero
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <TbStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
      <span className="text-sm font-medium">{value > 0 ? value.toFixed(1) : '—'}</span>
    </span>
  );
}

// ─── Tipo de orden para la tabla de barberos ───────────────────────────────────

type SortKey = 'completed_appointments' | 'total_revenue' | 'unique_clients' | 'avg_rating';
type SortDir = 'asc' | 'desc';

// ─── Modal de detalle de barbero ──────────────────────────────────────────────

function MemberDetailModal({
  member,
  onClose,
}: {
  member: BarbershopMemberStatsRow;
  onClose: () => void;
}) {
  const occupancyPct =
    member.available_hours > 0
      ? Math.min(Math.round((member.booked_hours / member.available_hours) * 100), 100)
      : null;

  const totalAppts   = member.completed_appointments + member.cancelled_appointments;
  const cancelPct    = totalAppts > 0
    ? Math.round((member.cancelled_appointments / totalAppts) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b">
          <Avatar name={member.professional_name} imageUrl={member.profile_image} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{member.professional_name}</h3>
            <p className="text-sm text-gray-500 font-mono">@{member.professional_slug}</p>
            <div className="mt-2">
              <RoleBadge role={member.role} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <TbX className="h-5 w-5" />
          </button>
        </div>

        {/* Métricas */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Citas realizadas</p>
            <p className="text-2xl font-bold text-blue-700">{member.completed_appointments}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Ingresos</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(member.total_revenue)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-600 font-medium mb-1">Clientes únicos</p>
            <p className="text-2xl font-bold text-purple-700">{member.unique_clients}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-xs text-yellow-600 font-medium mb-1">Rating promedio</p>
            <div className="flex items-center gap-1 mt-1">
              <TbStar className="w-5 h-5 text-yellow-500 fill-yellow-400" />
              <p className="text-2xl font-bold text-yellow-700">
                {member.avg_rating > 0 ? member.avg_rating.toFixed(1) : '—'}
              </p>
            </div>
          </div>

          {/* Ticket promedio */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Ticket promedio</p>
            <p className="text-2xl font-bold text-gray-700">{formatCurrency(member.avg_ticket)}</p>
          </div>

          {/* Cancelaciones */}
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Cancelaciones</p>
            <p className="text-2xl font-bold text-red-600">{member.cancelled_appointments}</p>
            {totalAppts > 0 && (
              <p className="text-xs text-red-400 mt-0.5">{cancelPct}% del total</p>
            )}
          </div>

          {/* Ocupación */}
          <div className="col-span-2 bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Ocupación</p>
            {occupancyPct !== null ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-700">{occupancyPct}%</span>
                  <span className="text-xs text-gray-400">
                    {member.booked_hours.toFixed(1)}h / {member.available_hours.toFixed(1)}h disponibles
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Sin horario configurado — no se puede calcular la ocupación
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabla de rendimiento por barbero ─────────────────────────────────────────

function MemberTable({ members }: { members: BarbershopMemberStatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('total_revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<BarbershopMemberStatsRow | null>(null);

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [members, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <TbChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'desc' ? (
      <TbChevronDown className="w-3 h-3 text-blue-600" />
    ) : (
      <TbChevronUp className="w-3 h-3 text-blue-600" />
    );
  };

  const HeaderBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {label}
      <SortIcon k={k} />
    </button>
  );

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por barbero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <TbUsers className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin datos en el período seleccionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por barbero</CardTitle>
          <CardDescription>Haz click en un barbero para ver el detalle completo</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Barbero</th>
                  <th className="text-right px-4 py-3">
                    <HeaderBtn k="completed_appointments" label="Cortes" />
                  </th>
                  <th className="text-right px-4 py-3">
                    <HeaderBtn k="total_revenue" label="Ingresos" />
                  </th>
                  <th className="text-right px-4 py-3">
                    <HeaderBtn k="unique_clients" label="Clientes" />
                  </th>
                  <th className="text-right px-4 py-3">
                    <HeaderBtn k="avg_rating" label="Rating" />
                  </th>
                  <th className="text-right px-6 py-3">Cancelaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((m) => (
                  <tr
                    key={m.professional_id}
                    onClick={() => setSelected(m)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.professional_name} imageUrl={m.profile_image} />
                        <div>
                          <p className="font-medium text-gray-900">{m.professional_name}</p>
                          <RoleBadge role={m.role} />
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-800">
                      {m.completed_appointments}
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-800">
                      {formatCurrency(m.total_revenue)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600">{m.unique_clients}</td>
                    <td className="text-right px-4 py-3">
                      <StarRating value={m.avg_rating} />
                    </td>
                    <td className="text-right px-6 py-3">
                      {m.cancelled_appointments > 0 ? (
                        <span className="text-red-500 font-medium">{m.cancelled_appointments}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <MemberDetailModal member={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ─── Rankings Top 3 ───────────────────────────────────────────────────────────

function RankingCard({
  title,
  icon: Icon,
  members,
  sortKey,
  format,
}: {
  title: string;
  icon: React.ElementType;
  members: BarbershopMemberStatsRow[];
  sortKey: keyof BarbershopMemberStatsRow;
  format: (v: number) => string;
}) {
  const top3 = useMemo(
    () =>
      [...members]
        .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
        .slice(0, 3),
    [members, sortKey],
  );

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top3.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
        ) : (
          top3.map((m, i) => (
            <div key={m.professional_id} className="flex items-center gap-3">
              <span className="text-lg w-6 flex-shrink-0">{medals[i]}</span>
              <Avatar name={m.professional_name} imageUrl={m.profile_image} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.professional_name}</p>
              </div>
              <span className="text-sm font-bold text-gray-800 flex-shrink-0">
                {format(m[sortKey] as number)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sección de servicios ─────────────────────────────────────────────────────

function ServiceStatsSection({
  services,
}: {
  services: { service_id: string; service_name: string; bookings: number; revenue: number }[];
}) {
  const maxBookings = Math.max(...services.map((s) => s.bookings), 1);
  const maxRevenue  = Math.max(...services.map((s) => s.revenue), 1);

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-6">Sin datos en el período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Por reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TbChartBar className="h-4 w-4 text-blue-600" />
            Más vendidos
          </CardTitle>
          <CardDescription>Servicios con más reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...services]
              .sort((a, b) => b.bookings - a.bookings)
              .slice(0, 8)
              .map((s, i) => (
                <div key={s.service_id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.service_name}</p>
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">
                        {s.bookings}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(s.bookings / maxBookings) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Por facturación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TbCurrencyDollar className="h-4 w-4 text-green-600" />
            Más rentables
          </CardTitle>
          <CardDescription>Servicios con mayor facturación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...services]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 8)
              .map((s, i) => (
                <div key={s.service_id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.service_name}</p>
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(s.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Gráfico de tendencia mensual ─────────────────────────────────────────────

type TrendMetric = 'revenue' | 'appointments' | 'unique_clients';

function MonthlyTrendChart({
  data,
}: {
  data: { period_start: string; month_label: string; appointments: number; revenue: number; unique_clients: number }[];
}) {
  const [metric, setMetric] = useState<TrendMetric>('revenue');

  const values   = data.map((d) => d[metric]);
  const maxValue = Math.max(...values, 1);

  const metricLabel: Record<TrendMetric, string> = {
    revenue:        'Ingresos',
    appointments:   'Citas',
    unique_clients: 'Clientes',
  };

  const metricColor: Record<TrendMetric, string> = {
    revenue:        'bg-blue-500',
    appointments:   'bg-purple-500',
    unique_clients: 'bg-green-500',
  };

  const formatValue = (v: number) =>
    metric === 'revenue' ? formatCurrency(v) : v.toString();

  // Formatear mes desde period_start (DATE ISO) en español chileno
  // Se añade T12:00:00 para evitar que el parser UTC adelante/retrase el día
  const formatMonthLabel = (periodStart: string): string =>
    new Date(periodStart + 'T12:00:00').toLocaleDateString('es-CL', {
      month: 'short',
    });

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-6">Sin datos históricos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Evolución mensual</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
            {(Object.keys(metricLabel) as TrendMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  metric === m
                    ? 'bg-white text-blue-700 shadow-sm font-medium'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {metricLabel[m]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-[600px] items-end h-48">
            {data.map((d) => {
              const val    = d[metric];
              const height = maxValue > 0 ? Math.max((val / maxValue) * 100, val > 0 ? 4 : 0) : 0;
              return (
                <div key={d.period_start} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {val > 0 ? formatValue(val) : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className={`w-full rounded-t ${metricColor[metric]} transition-all`}
                      style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 text-center leading-tight">
                    {formatMonthLabel(d.period_start)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Retención de clientes ────────────────────────────────────────────────────

function RetentionSection({
  retention,
}: {
  retention: { unique_clients: number; recurring_clients: number; return_rate: number };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TbRepeat className="h-5 w-5 text-blue-600" />
          Retención de clientes
        </CardTitle>
        <CardDescription>
          Cliente recurrente = 2 o más citas completadas en el período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-medium mb-1">Clientes únicos</p>
            <p className="text-3xl font-bold text-blue-700">{retention.unique_clients}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-green-600 font-medium mb-1">Recurrentes</p>
            <p className="text-3xl font-bold text-green-700">{retention.recurring_clients}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600 font-medium mb-1">Tasa de retorno</p>
            <p className="text-3xl font-bold text-purple-700">{retention.return_rate.toFixed(1)}%</p>
          </div>
        </div>
        {retention.unique_clients > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Clientes que volvieron</span>
              <span>{retention.return_rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(retention.return_rate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Top clientes ─────────────────────────────────────────────────────────────

function TopClientsSection({
  clients,
}: {
  clients: { client_name: string; client_email: string; visit_count: number; total_spent: number; last_visit: string }[];
}) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TbUser className="h-5 w-5 text-blue-600" />
            Top clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-6">Sin datos en el período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TbUser className="h-5 w-5 text-blue-600" />
          Top clientes
        </CardTitle>
        <CardDescription>Clientes más frecuentes en el período</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3">#</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-right px-4 py-3">Visitas</th>
                <th className="text-right px-4 py-3">Gasto total</th>
                <th className="text-right px-6 py-3">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((c, i) => (
                <tr key={c.client_email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-400 font-mono text-xs">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.client_name}</p>
                    <p className="text-xs text-gray-400">{c.client_email}</p>
                  </td>
                  <td className="text-right px-4 py-3 font-semibold text-gray-800">
                    {c.visit_count}
                  </td>
                  <td className="text-right px-4 py-3 font-semibold text-gray-800">
                    {formatCurrency(c.total_spent)}
                  </td>
                  <td className="text-right px-6 py-3 text-gray-500 text-xs">
                    {new Date(c.last_visit).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Componente principal BarbershopAnalytics ─────────────────────────────────

interface BarbershopAnalyticsProps {
  data: BarbershopAnalyticsData;
  barbershopName: string;
  selectedProfessionalName?: string | null;
}

export default function BarbershopAnalytics({ data, barbershopName, selectedProfessionalName }: BarbershopAnalyticsProps) {
  const { allTimeStats, periodStats, memberStats, monthlyTrend, serviceStats, retention, topClients } = data;

  // Cards summary — combinamos all-time (para "Totales") con period (para comparación)
  const attendanceRate =
    periodStats.completed_appointments + periodStats.cancelled_appointments > 0
      ? Math.round(
          (periodStats.completed_appointments /
            (periodStats.completed_appointments + periodStats.cancelled_appointments)) *
            100,
        )
      : 0;

  const avgTicket =
    periodStats.completed_appointments > 0
      ? periodStats.total_revenue / periodStats.completed_appointments
      : 0;

  const avgTicketAllTime =
    allTimeStats.completed_appointments > 0
      ? allTimeStats.total_revenue / allTimeStats.completed_appointments
      : 0;

  return (
    <div className="space-y-6">
      {/* Cabecera barbería */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <TbBuildingStore className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">{barbershopName}</p>
          <p className="text-xs text-gray-400">
            {selectedProfessionalName
              ? `Analíticas de ${selectedProfessionalName}`
              : 'Analíticas globales del equipo'}
          </p>
        </div>
      </div>

      {/* ── Cards: Totales (all-time) ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Totales históricos
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Citas totales</p>
                <TbCalendar className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{allTimeStats.completed_appointments}</p>
              <p className="text-xs text-gray-400 mt-1">completadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Ingresos totales</p>
                <TbCurrencyDollar className="w-4 h-4 text-green-500 shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(allTimeStats.total_revenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ticket: {formatCurrency(avgTicketAllTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Clientes únicos</p>
                <TbUsers className="w-4 h-4 text-purple-500 shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{allTimeStats.unique_clients}</p>
              <p className="text-xs text-gray-400 mt-1">histórico</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Rating promedio</p>
                <TbStar className="w-4 h-4 text-yellow-400 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-gray-900">
                  {allTimeStats.avg_rating > 0 ? allTimeStats.avg_rating.toFixed(1) : '—'}
                </p>
                <span className="text-xs text-gray-400">/5</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{allTimeStats.total_reviews} reseñas</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Cards: Período seleccionado ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          En el período seleccionado
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 line-clamp-1">Citas</p>
                <TbCalendar className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-xl font-bold text-gray-900">{periodStats.completed_appointments}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 line-clamp-1">Ingresos</p>
                <TbCurrencyDollar className="w-4 h-4 text-green-500 shrink-0" />
              </div>
              <p className="text-xl font-bold text-gray-900 truncate">
                {formatCurrency(periodStats.total_revenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 line-clamp-1">Ticket prom.</p>
                <TbCurrencyDollar className="w-4 h-4 text-purple-500 shrink-0" />
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(avgTicket)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 line-clamp-1">Clientes recurrentes</p>
                <TbRepeat className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>
              <p className="text-xl font-bold text-gray-900">{retention.recurring_clients}</p>
              <p className="text-xs text-gray-400 mt-0.5">{retention.return_rate.toFixed(0)}% retorno</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 line-clamp-1">Tasa asistencia</p>
                <TbAlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              </div>
              <p className="text-xl font-bold text-gray-900">{attendanceRate}%</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {periodStats.cancelled_appointments} cancelaciones
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Tabla de rendimiento por barbero ── */}
      <MemberTable members={memberStats} />

      {/* ── Rankings Top 3 ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Rankings del período
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RankingCard
            title="Más ingresos"
            icon={TbCurrencyDollar}
            members={memberStats}
            sortKey="total_revenue"
            format={(v) => formatCurrency(v)}
          />
          <RankingCard
            title="Más cortes"
            icon={TbScissors}
            members={memberStats}
            sortKey="completed_appointments"
            format={(v) => `${v} cortes`}
          />
          <RankingCard
            title="Mejor rating"
            icon={TbStar}
            members={memberStats.filter((m) => m.avg_rating > 0)}
            sortKey="avg_rating"
            format={(v) => `${v.toFixed(1)} ★`}
          />
          <RankingCard
            title="Más clientes"
            icon={TbUsers}
            members={memberStats}
            sortKey="unique_clients"
            format={(v) => `${v} clientes`}
          />
        </div>
      </div>

      {/* ── Servicios ── */}
      <ServiceStatsSection services={serviceStats} />

      {/* ── Evolución mensual (12 meses, siempre, ignora filtro de período) ── */}
      <MonthlyTrendChart data={monthlyTrend} />

      {/* ── Retención ── */}
      <RetentionSection retention={retention} />

      {/* ── Ocupación por barbero ── */}
      {memberStats.some((m) => m.available_hours > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbClock className="h-5 w-5 text-blue-600" />
              Ocupación por barbero
            </CardTitle>
            <CardDescription>
              Horas reservadas vs. horas disponibles configuradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...memberStats]
                .filter((m) => m.available_hours > 0)
                .sort(
                  (a, b) =>
                    b.booked_hours / b.available_hours -
                    a.booked_hours / a.available_hours,
                )
                .map((m) => {
                  const occ = Math.min(
                    Math.round((m.booked_hours / m.available_hours) * 100),
                    100,
                  );
                  return (
                    <div key={m.professional_id} className="flex items-center gap-4">
                      <Avatar name={m.professional_name} imageUrl={m.profile_image} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {m.professional_name}
                          </p>
                          <span className="text-sm font-bold text-gray-700 ml-2">{occ}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              occ >= 80 ? 'bg-green-500' : occ >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${occ}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.booked_hours.toFixed(1)}h de {m.available_hours.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top clientes ── */}
      <TopClientsSection clients={topClients} />

      {/* ── Cancelaciones por barbero ── */}
      {memberStats.some((m) => m.cancelled_appointments > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbAlertTriangle className="h-5 w-5 text-red-500" />
              Cancelaciones por barbero
            </CardTitle>
            <CardDescription>
              Barberos con mayor tasa de cancelación en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...memberStats]
                .filter((m) => m.completed_appointments + m.cancelled_appointments > 0)
                .sort((a, b) => b.cancelled_appointments - a.cancelled_appointments)
                .map((m) => {
                  const total    = m.completed_appointments + m.cancelled_appointments;
                  const cancelPct = total > 0 ? Math.round((m.cancelled_appointments / total) * 100) : 0;
                  return (
                    <div key={m.professional_id} className="flex items-center gap-4">
                      <Avatar name={m.professional_name} imageUrl={m.profile_image} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {m.professional_name}
                          </p>
                          <span
                            className={`text-sm font-bold ml-2 ${
                              cancelPct > 20
                                ? 'text-red-500'
                                : cancelPct > 10
                                  ? 'text-orange-500'
                                  : 'text-gray-500'
                            }`}
                          >
                            {m.cancelled_appointments} ({cancelPct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
