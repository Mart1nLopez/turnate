'use client';

import { useState } from 'react';
import { TbCheck, TbLock, TbX } from 'react-icons/tb';
import { FcGoogle } from 'react-icons/fc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useSettings } from '@/hooks/useSettings';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function SettingsPage() {
  const {
    isSynced,
    loading: calendarLoading,
    submitting: calendarSubmitting,
    handleConnect,
    handleDisconnect,
  } = useGoogleCalendar();

  const {
    loading: settingsLoading,
    error,
    success,
    passwordError,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleChangePassword,
  } = useSettings();

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Gestiona tu cuenta, integraciones y preferencias</p>
      </div>

      {/* Google Calendar */}
      <Card className="overflow-hidden border-blue-100 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg
                className="w-6 h-6"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink">
                <g>
                  <g transform="translate(3.75 3.75)">
                    <path
                      fill="#FFFFFF"
                      d="M148.882,43.618l-47.368-5.263l-57.895,5.263L38.355,96.25l5.263,52.632l52.632,6.579l52.632-6.579
			l5.263-53.947L148.882,43.618z"
                    />
                    <path
                      fill="#1A73E8"
                      d="M65.211,125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c0.829,3.158,2.276,5.605,4.342,7.342
			c2.053,1.737,4.553,2.592,7.474,2.592c2.987,0,5.553-0.908,7.697-2.724s3.224-4.132,3.224-6.934c0-2.868-1.132-5.211-3.395-7.026
			s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921,0,5.382-0.789,7.382-2.368c2-1.579,3-3.737,3-6.487
			c0-2.447-0.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684,0-4.816,0.711-6.395,2.145s-2.724,3.197-3.447,5.276
			l-9.039-3.763c1.197-3.395,3.395-6.395,6.618-8.987c3.224-2.592,7.342-3.895,12.342-3.895c3.697,0,7.026,0.711,9.974,2.145
			c2.947,1.434,5.263,3.421,6.934,5.947c1.671,2.539,2.5,5.382,2.5,8.539c0,3.224-0.776,5.947-2.329,8.184
			c-1.553,2.237-3.461,3.947-5.724,5.145v0.539c2.987,1.25,5.421,3.158,7.342,5.724c1.908,2.566,2.868,5.632,2.868,9.211
			s-0.908,6.776-2.724,9.579c-1.816,2.803-4.329,5.013-7.513,6.618c-3.197,1.605-6.789,2.421-10.776,2.421
			C73.408,129.263,69.145,127.934,65.211,125.276z"
                    />
                    <path
                      fill="#1A73E8"
                      d="M121.25,79.961l-9.974,7.25l-5.013-7.605l17.987-12.974h6.895v61.197h-9.895L121.25,79.961z"
                    />
                    <path
                      fill="#EA4335"
                      d="M148.882,196.25l47.368-47.368l-23.684-10.526l-23.684,10.526l-10.526,23.684L148.882,196.25z"
                    />
                    <path fill="#34A853" d="M33.092,172.566l10.526,23.684h105.263v-47.368H43.618L33.092,172.566z" />
                    <path
                      fill="#4285F4"
                      d="M12.039-3.75C3.316-3.75-3.75,3.316-3.75,12.039v136.842l23.684,10.526l23.684-10.526V43.618h105.263
			l10.526-23.684L148.882-3.75H12.039z"
                    />
                    <path
                      fill="#188038"
                      d="M-3.75,148.882v31.579c0,8.724,7.066,15.789,15.789,15.789h31.579v-47.368H-3.75z"
                    />
                    <path fill="#FBBC04" d="M148.882,43.618v105.263h47.368V43.618l-23.684-10.526L148.882,43.618z" />
                    <path
                      fill="#1967D2"
                      d="M196.25,43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z"
                    />
                  </g>
                </g>
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>Sincronización automática de tus citas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {calendarLoading ?
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          : isSynced ?
            // --- VISTA "CONECTADO" ---
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TbCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Cuenta vinculada exitosamente</h4>
                  <p className="text-sm text-gray-500">
                    Tus citas de Turnate se sincronizan con tu calendario principal.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDisconnect(confirm)}
                disabled={calendarSubmitting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto">
                Desconectar
              </Button>
            </div>
            // --- VISTA "DESCONECTADO" ---
          : <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text prose-break-words">
                  Sincroniza tus citas de Turnate con tu calendario personal de Google.
                </h4>
                <p className="text-sm text-gray-500 prose-break-words">
                  Recuerda otorgar los permisos necesarios para que la sincronización funcione correctamente.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={calendarSubmitting}
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 w-full sm:w-auto shadow-sm">
                <FcGoogle className="w-5 h-5 mr-2" />
                Conectar con Google
              </Button>
            </div>
          }
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TbLock className="w-5 h-5 mr-2 text-gray-500" />
            Seguridad
          </CardTitle>
          <CardDescription>Gestiona el acceso a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ?
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Contraseña</h4>
                <p className="text-sm text-gray-500">Se recomienda usar una contraseña segura y única.</p>
              </div>
              <Button className="py-7 sm:py-2 sm:w-auto" variant="default" onClick={() => setShowPasswordForm(true)}>
                Cambiar contraseña
              </Button>
            </div>
          : <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Cambiar Contraseña</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="h-8 w-8 p-0">
                  <TbX className="h-4 w-4" />
                </Button>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  <p className="text-sm">Contraseña actualizada exitosamente</p>
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  await handleChangePassword(e);
                }}
                className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                  />
                  {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={settingsLoading}>
                    {settingsLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPasswordForm(false)}
                    disabled={settingsLoading}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          }
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
