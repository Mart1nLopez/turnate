'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentProfessional } from '@/lib/supabase';
import {
  getDashboardStats,
  getTodayAppointments,
  getMonthlyRevenue,
  getServiceStats,
  getMonthlyAppointments,
  DashboardStats,
  MonthlyRevenue,
  ServiceStats,
} from '@/services/dashboardService';
import { Appointment, Service } from '@/types';

interface DashboardData {
  stats: DashboardStats & {
    monthlyAppointments?: number;
    monthlyCompletedAppointments?: number;
    monthlyCancelledAppointments?: number;
    monthlyConversionRate?: number;
  };
  todayAppointments: (Appointment & { service?: Service; client?: { name: string } })[];
  monthlyRevenue: MonthlyRevenue[];
  serviceStats: ServiceStats[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: {
      todayAppointments: 0,
      currentPeriodAppointments: 0,
      monthlyRevenue: 0,
      totalClients: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      conversionRate: 0,
    },
    todayAppointments: [],
    monthlyRevenue: [],
    serviceStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { professional } = await getCurrentProfessional();
      if (!professional) {
        throw new Error('No se pudo obtener la información del profesional');
      }

      const [stats, todayApts, monthlyRev, serviceStats, monthlyApts] = await Promise.all([
        getDashboardStats(professional.id),
        getTodayAppointments(professional.id),
        getMonthlyRevenue(professional.id),
        getServiceStats(professional.id),
        getMonthlyAppointments(professional.id),
      ]);

      setData({
        stats: {
          ...stats,
          monthlyAppointments: monthlyApts.total,
          monthlyCompletedAppointments: monthlyApts.completed,
          monthlyCancelledAppointments: monthlyApts.cancelled,
          monthlyConversionRate: monthlyApts.conversionRate,
        },
        todayAppointments: todayApts,
        monthlyRevenue: monthlyRev,
        serviceStats,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    data,
    loading,
    error,
    refresh: loadDashboardData,
  };
}
