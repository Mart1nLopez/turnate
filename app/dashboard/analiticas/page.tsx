'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TbCalendar,
  TbUsers,
  TbCurrencyDollar,
  TbTrendingUp,
  TbTrendingDown,
  TbClock,
  TbStar,
  TbPercentage,
  TbBuildingStore,
  TbUser,
} from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentProfessional } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getAnalyticsStats, AdvancedStats } from '@/services/analyticsService';
import { useBarbershop } from '@/hooks/useBarbershop';
import {
  loadBarbershopAnalytics,
  getDateRangeParams,
  BarbershopAnalyticsData,
} from '@/services/barbershopAnalyticsService';
import BarbershopAnalytics from './_components/BarbershopAnalytics';
import { AnalyticsDateRange } from '@/types';

// ─── Tipos de tab ─────────────────────────────────────────────────────────────

type AnalyticsTab = 'individual' | 'barbershop';

// ─── Filtros de fecha ─────────────────────────────────────────────────────────

const DATE_RANGE_OPTIONS: { value: AnalyticsDateRange; label: string }[] = [
  { value: 'today',  label: 'Hoy'      },
  { value: '7d',     label: '7 días'   },
  { value: '30d',    label: '30 días'  },
  { value: '90d',    label: '90 días'  },
  { value: 'year',   label: 'Año'      },
  { value: 'custom', label: 'Rango'    },
];

// ─── Analíticas individuales (componente extraído) ────────────────────────────

function IndividualAnalytics({
  stats,
  loading,
}: {
  stats: AdvancedStats | null;
  loading: boolean;
}) {
  const formatPct = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const pctColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const pctIcon = (current: number, previous: number) => {
    if (current > previous) return <TbTrendingUp className="w-4 h-4" />;
    if (current < previous) return <TbTrendingDown className="w-4 h-4" />;
    return <TbTrendingUp className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Cargando analíticas..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Citas Totales</p>
              <TbCalendar className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalAppointments}</p>
              <div
                className={`flex items-center text-xs mt-1 ${pctColor(stats.currentMonthAppointments, stats.previousMonthAppointments)}`}
              >
                {pctIcon(stats.currentMonthAppointments, stats.previousMonthAppointments)}
                <span className="ml-1 truncate">
                  {formatPct(stats.currentMonthAppointments, stats.previousMonthAppointments)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Clientes Únicos</p>
              <TbUsers className="w-5 h-5 text-green-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalClients}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">Base de clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Ingresos</p>
              <TbCurrencyDollar className="w-5 h-5 text-purple-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 truncate">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <div
                className={`flex items-center text-xs mt-1 ${pctColor(stats.currentMonthRevenue, stats.previousMonthRevenue)}`}
              >
                {pctIcon(stats.currentMonthRevenue, stats.previousMonthRevenue)}
                <span className="ml-1 truncate">
                  {formatPct(stats.currentMonthRevenue, stats.previousMonthRevenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Calificación</p>
              <TbStar className="w-5 h-5 text-yellow-500 shrink-0" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <span className="text-xs text-gray-500">/5</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{stats.totalReviews} reseñas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Citas Hoy</p>
              <TbClock className="w-5 h-5 text-orange-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.todayAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Próximas</p>
              <TbCalendar className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Duración prom.</p>
              <TbClock className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(stats.averageSessionDuration)}
              </p>
              <p className="text-xs text-gray-500 mt-1">minutos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 line-clamp-1">Tasa Reseñas</p>
              <TbPercentage className="w-5 h-5 text-pink-600 shrink-0" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalAppointments > 0
                ? Math.round((stats.totalReviews / stats.totalAppointments) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Servicios + Horas Pico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Populares</CardTitle>
            <CardDescription>Tus servicios con más demanda</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topServices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en el período</p>
            ) : (
              <div className="space-y-4">
                {stats.topServices.map((s, index) => (
                  <div key={s.service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.service.name}</p>
                        <p className="text-sm text-gray-500">{s.count} citas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(s.revenue)}</p>
                      <p className="text-sm text-gray-500">ingresos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horas Más Ocupadas</CardTitle>
            <CardDescription>Cuando tienes más citas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.peakHours.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en el período</p>
            ) : (
              <div className="space-y-4">
                {stats.peakHours.map((h, index) => (
                  <div key={h.hour} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {h.hour.toString().padStart(2, '0')}:00
                        </p>
                        <p className="text-sm text-gray-500">
                          {h.count} cita{h.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(h.count / Math.max(...stats.peakHours.map((x) => x.count))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tendencia Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Semanal</CardTitle>
          <CardDescription>Citas e ingresos de las últimas 8 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-8 gap-2 min-w-[600px]">
              {stats.weeklyTrend.map((week) => (
                <div key={week.week} className="text-center">
                  <div className="space-y-2">
                    <div className="h-20 bg-gray-200 rounded relative overflow-hidden">
                      <div
                        className="bg-blue-500 absolute bottom-0 left-0 right-0 rounded"
                        style={{
                          height: `${
                            Math.max(...stats.weeklyTrend.map((w) => w.appointments)) > 0
                              ? (week.appointments /
                                  Math.max(...stats.weeklyTrend.map((w) => w.appointments))) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{week.week}</p>
                      <p className="text-xs text-gray-500">{week.appointments} citas</p>
                      <p className="text-xs text-gray-500">{formatCurrency(week.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución de Calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
          <CardDescription>Cómo califican tus clientes tu servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...stats.ratingDistribution].reverse().map((r) => (
              <div key={r.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{r.rating}</span>
                  <TbStar className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalReviews > 0 ? (r.count / stats.totalReviews) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  // ── Barbería ──
  const { barbershop, canManage, loading: barbershopLoading } = useBarbershop();

  // ── Tab activo ──
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('individual');

  // ── Rango de fechas (compartido entre ambas vistas) ──
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [showCustom,  setShowCustom]  = useState(false);

  // ── Estado analíticas individuales ──
  const [individualStats,    setIndividualStats]    = useState<AdvancedStats | null>(null);
  const [individualLoading,  setIndividualLoading]  = useState(true);

  // ── Estado analíticas barbería ──
  const [barbershopData,    setBarbershopData]    = useState<BarbershopAnalyticsData | null>(null);
  const [barbershopLoading2, setBarbershopLoading2] = useState(false);
  const [barbershopError,   setBarbershopError]   = useState<string | null>(null);

  // ── Cargar analíticas individuales ──
  const loadIndividual = useCallback(async () => {
    setIndividualLoading(true);
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const customDates =
        dateRange === 'custom' && customStart && customEnd
          ? { start: customStart, end: customEnd }
          : undefined;

      const stats = await getAnalyticsStats(professional.id, dateRange, customDates);
      setIndividualStats(stats);
    } catch (err) {
      console.error('[Analytics] Error cargando analíticas individuales:', err);
    } finally {
      setIndividualLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  // ── Cargar analíticas de barbería ──
  const loadBarbershop = useCallback(async () => {
    if (!barbershop || !canManage) return;
    setBarbershopLoading2(true);
    setBarbershopError(null);
    try {
      const custom =
        dateRange === 'custom' && customStart && customEnd
          ? { start: customStart, end: customEnd }
          : undefined;
      const { start, end } = getDateRangeParams(dateRange, custom);
      const data = await loadBarbershopAnalytics(barbershop.id, start, end);
      setBarbershopData(data);
    } catch (err) {
      const e = err as Record<string, unknown>;
      console.error('[Analytics] Error barbershop — code:', e?.code, '| message:', e?.message);
      setBarbershopError('Error al cargar las analíticas de la barbería. Intenta nuevamente.');
    } finally {
      setBarbershopLoading2(false);
    }
  }, [barbershop, canManage, dateRange, customStart, customEnd]);

  // ── Efectos de carga ──
  useEffect(() => {
    loadIndividual();
  }, [loadIndividual]);

  useEffect(() => {
    if (activeTab === 'barbershop' && canManage && barbershop) {
      loadBarbershop();
    }
  }, [activeTab, loadBarbershop, canManage, barbershop]);

  // ── Aplicar rango personalizado ──
  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    if (new Date(customStart) > new Date(customEnd)) return;
    setShowCustom(false);
    // Trigger re-load via dateRange ya establecido como 'custom'
    if (activeTab === 'individual') loadIndividual();
    else loadBarbershop();
  };

  const handleDateRange = (range: AnalyticsDateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  };

  // ── Loading inicial de barbería ──
  if (barbershopLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-600">Métricas detalladas de tu negocio</p>
        </div>
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  // ── Si es owner de barbería, mostrar las tabs ──
  const showTabs = canManage && barbershop !== null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-600">Métricas detalladas de tu negocio</p>
        </div>

        {/* ── Tabs (solo para owners) ── */}
        {showTabs && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'individual'
                  ? 'bg-white text-blue-700 shadow-sm font-medium'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TbUser className="w-4 h-4" />
              Mis analíticas
            </button>
            <button
              onClick={() => setActiveTab('barbershop')}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'barbershop'
                  ? 'bg-white text-blue-700 shadow-sm font-medium'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TbBuildingStore className="w-4 h-4" />
              Analíticas barbería
            </button>
          </div>
        )}

        {/* ── Filtros de fecha ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDateRange(opt.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateRange === opt.value
                    ? 'bg-white text-blue-700 shadow-sm font-medium'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Selector de rango personalizado */}
          {showCustom && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-sm border-0 outline-none text-gray-700"
                max={customEnd || undefined}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-sm border-0 outline-none text-gray-700"
                min={customStart || undefined}
              />
              <button
                onClick={applyCustomRange}
                disabled={!customStart || !customEnd}
                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido según tab ── */}
      {activeTab === 'individual' && (
        <IndividualAnalytics stats={individualStats} loading={individualLoading} />
      )}

      {activeTab === 'barbershop' && canManage && barbershop && (
        <>
          {barbershopLoading2 && (
            <LoadingSpinner size="lg" text="Cargando analíticas de la barbería..." />
          )}
          {!barbershopLoading2 && barbershopError && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{barbershopError}</p>
              <button
                onClick={loadBarbershop}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Reintentar
              </button>
            </div>
          )}
          {!barbershopLoading2 && !barbershopError && barbershopData && (
            <BarbershopAnalytics
              data={barbershopData}
              barbershopName={barbershop.name}
            />
          )}
        </>
      )}
    </div>
  );
}
