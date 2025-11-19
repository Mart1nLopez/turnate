'use client';

import { Suspense } from 'react';
import { TbMail, TbCheck, TbRefresh } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useConfirmEmail } from '@/hooks/useConfirmEmail';

function ConfirmEmailContent() {
  const {
    email,
    isResending,
    resent,
    isChecking,
    handleManualCheck,
    handleResendEmail
  } = useConfirmEmail();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbMail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Confirma tu email</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Hemos enviado un link de confirmación a:</p>

          <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded">{email}</p>

          <p className="text-sm text-gray-500">
            Revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el link para activar tu cuenta.
          </p>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
              <span className="text-sm">Verificando automáticamente...</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={handleManualCheck} disabled={isChecking} className="w-full">
              {isChecking ?
                <>
                  <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              : <>
                  <TbCheck className="w-4 h-4 mr-2" />
                  Ya confirmé mi email
                </>
              }
            </Button>

            {!resent ?
              <Button onClick={handleResendEmail} disabled={isResending} variant="outline" className="w-full">
                {isResending ?
                  <>
                    <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                : <>
                    <TbRefresh className="w-4 h-4 mr-2" />
                    Reenviar email
                  </>
                }
              </Button>
            : <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <TbCheck className="w-4 h-4 mr-2" />
                  <span className="text-sm">Email reenviado exitosamente</span>
                </div>
              </div>
            }

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-3">¿Problemas con la confirmación?</p>
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
