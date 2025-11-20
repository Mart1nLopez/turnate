export function validatePassword(password: string, confirmPassword?: string): { isValid: boolean; error?: string } {
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { isValid: false, error: 'Las contraseñas no coinciden' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una letra mayúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un número' };
  }

  return { isValid: true };
}

export function translatePasswordError(error: Error): string | null {
  if (error.message.includes('New password should be different from the old password')) {
    return 'La nueva contraseña debe ser diferente de la contraseña actual';
  } else if (error.message.includes('Password')) {
    return 'La contraseña debe tener al menos 8 caracteres';
  } else {
    return null;
  }
}
