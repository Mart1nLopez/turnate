'use client';

import { TbClock } from 'react-icons/tb';
import Link from 'next/link';

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100">
          <TbClock className="h-12 w-12 text-yellow-600" />
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Cuenta en revisión
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Tu cuenta de profesional ha sido creada exitosamente y está pendiente de aprobación por parte de nuestro equipo.
          </p>
          <p className="mt-4 text-base text-gray-500">
            Te notificaremos una vez que tu cuenta haya sido activada.
          </p>
        </div>
        <div className="mt-5">
          <Link
            href="/"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
