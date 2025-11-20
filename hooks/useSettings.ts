'use client';

import { useState } from 'react';
import { AuthService } from '@/services/authService';
import { validatePassword, translatePasswordError } from '@/lib/passwordValidator';

export function useSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPasswordError(null);

    const validation = validatePassword(newPassword, confirmPassword);
    if (!validation.isValid) {
      setPasswordError(validation.error!);
      return;
    }

    setLoading(true);
    try {
      const { user, error: userError } = await AuthService.getCurrentUser();

      if (userError || !user?.email) {
        throw new Error('No se pudo verificar tu sesión');
      }

      const { error: signInError } = await AuthService.signIn(user.email, currentPassword);

      if (signInError) {
        setError('La contraseña actual es incorrecta');
        setLoading(false);
        return;
      }

      // 2. Update password
      const { error: updateError } = await AuthService.updatePassword(newPassword);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      let errorMessage = 'Error desconocido al cambiar la contraseña';

      if (error instanceof Error) {
        const translated = translatePasswordError(error);
        if (translated) {
          errorMessage = translated;
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
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
  };
}
