'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TbSettings,
  TbBell,
  TbMail,
  TbLock,
  TbDeviceFloppy,
  TbTrash,
  TbEye,
  TbEyeOff,
  TbClock,
  TbShield,
} from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Professional } from '@/types';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  newAppointments: boolean;
  appointmentReminders: boolean;
  cancellations: boolean;
  reviews: boolean;
}

interface BusinessSettings {
  autoConfirmAppointments: boolean;
  allowOnlinePayments: boolean;
  requirePrepayment: boolean;
  cancellationPolicy: string;
  reminderHours: number;
  maxAdvanceBookingDays: number;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  dataExportEnabled: boolean;
}

export default function ConfiguracionPage() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    newAppointments: true,
    appointmentReminders: true,
    cancellations: true,
    reviews: true,
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    autoConfirmAppointments: true,
    allowOnlinePayments: false,
    requirePrepayment: false,
    cancellationPolicy: '24 horas de anticipación',
    reminderHours: 24,
    maxAdvanceBookingDays: 30,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    dataExportEnabled: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const loadProfessional = useCallback(async () => {
    try {
      const { professional, error } = await getCurrentProfessional();
      if (error || !professional) throw error;

      setProfessional(professional);

      // Aquí cargarías las configuraciones desde la base de datos
      // Por ahora usamos valores por defecto
    } catch (error) {
      console.error('Error loading professional:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfessional();
  }, [loadProfessional]);

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleBusinessChange = (key: keyof BusinessSettings, value: string | number | boolean) => {
    setBusinessSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSecurityChange = (key: keyof SecuritySettings) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      // Aquí guardarías las configuraciones en la base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular carga
      toast.success('Configuraciones de notificaciones guardadas');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const saveBusinessSettings = async () => {
    setSaving(true);
    try {
      // Aquí guardarías las configuraciones en la base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular carga
      toast.success('Configuraciones de negocio guardadas');
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    setSaving(true);
    try {
      // Aquí guardarías las configuraciones en la base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular carga
      toast.success('Configuraciones de seguridad guardadas');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Contraseña actualizada exitosamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      if (!professional) return;

      // Obtener todos los datos del profesional
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professional.id);

      const { data: services } = await supabase.from('services').select('*').eq('professional_id', professional.id);

      const { data: reviews } = await supabase.from('reviews').select('*').eq('professional_id', professional.id);

      const exportData = {
        professional,
        appointments,
        services,
        reviews,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnate-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar datos');
    }
  };

  const deleteAccount = async () => {
    const confirmed = await confirm({
      title: '¿Eliminar cuenta permanentemente?',
      description:
        'Esta acción es irreversible. Se eliminará toda tu información, citas, servicios y datos asociados. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar cuenta',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      // Aquí implementarías la lógica de eliminación de cuenta
      toast.info('Funcionalidad de eliminación no implementada aún');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error al eliminar cuenta');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TbSettings className="w-8 h-8 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Gestiona las configuraciones de tu cuenta</p>
          </div>
        </div>
        <LoadingSpinner size="lg" text="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div>
      {/* Aviso de implementación futura */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-yellow-800">
          <TbClock className="w-5 h-5" />
          <span className="font-medium">Próximamente</span>
        </div>
        <p className="text-yellow-700 mt-1">
          Las configuraciones del sistema están en desarrollo y estarán disponibles en una próxima actualización.
        </p>
      </div>
      <div className="space-y-6 opacity-50">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TbSettings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Gestiona las configuraciones de tu cuenta y negocio</p>
          </div>
        </div>

        {/* Configuraciones de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbBell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura cuándo y cómo quieres recibir notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Métodos de notificación</h4>
                {[
                  { key: 'emailNotifications' as const, label: 'Notificaciones por email', icon: TbMail },
                  { key: 'smsNotifications' as const, label: 'Notificaciones por SMS', icon: TbBell },
                ].map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <input
                      disabled
                      type="checkbox"
                      checked={notificationSettings[key]}
                      onChange={() => handleNotificationChange(key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Tipos de notificación</h4>
                {[
                  { key: 'newAppointments' as const, label: 'Nuevas citas agendadas' },
                  { key: 'appointmentReminders' as const, label: 'Recordatorios de citas' },
                  { key: 'cancellations' as const, label: 'Cancelaciones de citas' },
                  { key: 'reviews' as const, label: 'Nuevas reseñas' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="font-medium">{label}</span>
                    <input
                      disabled
                      type="checkbox"
                      checked={notificationSettings[key]}
                      onChange={() => handleNotificationChange(key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={saveNotificationSettings} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuraciones de Negocio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbClock className="w-5 h-5" />
              Configuración de Negocio
            </CardTitle>
            <CardDescription>Configura cómo funciona tu sistema de citas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Confirmación de citas</h4>
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="font-medium">Auto-confirmar citas</span>
                    <p className="text-sm text-gray-500">Las citas se confirman automáticamente</p>
                  </div>
                  <input
                    disabled
                    type="checkbox"
                    checked={businessSettings.autoConfirmAppointments}
                    onChange={() =>
                      handleBusinessChange('autoConfirmAppointments', !businessSettings.autoConfirmAppointments)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Política de cancelación</label>
                  <Input
                    disabled
                    value={businessSettings.cancellationPolicy}
                    onChange={(e) => handleBusinessChange('cancellationPolicy', e.target.value)}
                    placeholder="Ej: 24 horas de anticipación"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Configuración de tiempo</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recordatorio (horas antes)</label>
                  <Input
                    disabled
                    type="number"
                    min="1"
                    max="168"
                    value={businessSettings.reminderHours}
                    onChange={(e) => handleBusinessChange('reminderHours', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Máximo días para agendar</label>
                  <Input
                    disabled
                    type="number"
                    min="1"
                    max="365"
                    value={businessSettings.maxAdvanceBookingDays}
                    onChange={(e) => handleBusinessChange('maxAdvanceBookingDays', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={saveBusinessSettings} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuraciones de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbShield className="w-5 h-5" />
              Seguridad y Privacidad
            </CardTitle>
            <CardDescription>Gestiona la seguridad de tu cuenta y datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Cambio de contraseña */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Contraseña</h4>
                    <p className="text-sm text-gray-500">Actualiza tu contraseña regularmente</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    <TbLock className="w-4 h-4 mr-2" />
                    {showPasswordForm ? 'Cancelar' : 'Cambiar Contraseña'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Input
                          disabled
                          type={showPasswords.current ? 'text' : 'password'}
                          placeholder="Contraseña actual"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {showPasswords.current ?
                            <TbEyeOff className="w-4 h-4 text-gray-400" />
                          : <TbEye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          disabled
                          type={showPasswords.new ? 'text' : 'password'}
                          placeholder="Nueva contraseña"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {showPasswords.new ?
                            <TbEyeOff className="w-4 h-4 text-gray-400" />
                          : <TbEye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          disabled
                          type={showPasswords.confirm ? 'text' : 'password'}
                          placeholder="Confirmar contraseña"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {showPasswords.confirm ?
                            <TbEyeOff className="w-4 h-4 text-gray-400" />
                          : <TbEye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                      {saving ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </form>
                )}
              </div>

              {/* Configuraciones de seguridad */}
              <div className="space-y-3">
                {[
                  {
                    key: 'loginNotifications' as const,
                    label: 'Notificaciones de inicio de sesión',
                    description: 'Recibe un email cuando inicies sesión desde un nuevo dispositivo',
                  },
                  {
                    key: 'dataExportEnabled' as const,
                    label: 'Permitir exportación de datos',
                    description: 'Permite descargar todos tus datos en formato JSON',
                  },
                ].map(({ key, label, description }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <span className="font-medium">{label}</span>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <input
                      disabled
                      type="checkbox"
                      checked={securitySettings[key]}
                      onChange={() => handleSecurityChange(key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={saveSecuritySettings} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbDeviceFloppy className="w-5 h-5" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>Exporta o elimina tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={exportData}
                disabled={!securitySettings.dataExportEnabled}
                className="flex-1">
                <TbDeviceFloppy className="w-4 h-4 mr-2" />
                Exportar Datos
              </Button>

              <Button variant="destructive" onClick={deleteAccount} className="flex-1">
                <TbTrash className="w-4 h-4 mr-2" />
                Eliminar Cuenta
              </Button>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• La exportación incluye todos tus datos: perfil, citas, servicios y reseñas</p>
              <p>• La eliminación de cuenta es irreversible y borra todos tus datos</p>
              <p>• Recomendamos exportar tus datos antes de eliminar la cuenta</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog />
    </div>
  );
}
