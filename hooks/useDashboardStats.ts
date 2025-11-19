import { useState, useEffect, useCallback } from 'react';
import { getCurrentProfessional } from '@/lib/supabase';
import {
  getDashboardStats,
  getMonthlyRevenue,
  getServiceStats,
  DashboardStats,
  MonthlyRevenue,
  ServiceStats,
} from '@/services/dashboardService';

interface DashboardData {
  stats: DashboardStats | null;
  monthlyRevenue: MonthlyRevenue[];
  serviceStats: ServiceStats[];
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    monthlyRevenue: [],
    serviceStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { professional, error: profError } = await getCurrentProfessional();
      if (profError || !professional) throw new Error('No se pudo obtener el profesional');

      const [stats, monthlyRevenue, serviceStats] = await Promise.all([
        getDashboardStats(professional.id),
        getMonthlyRevenue(professional.id),
        getServiceStats(professional.id),
      ]);

      setData({ stats, monthlyRevenue, serviceStats });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
