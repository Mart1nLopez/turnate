import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Service, Professional } from '@/types';

interface AppointmentSummaryProps {
  selectedService: Service | null;
  professional: Professional;
  selectedDate: Date | null;
  selectedTime: string;
}

export default function AppointmentSummary({
  selectedService,
  professional,
  selectedDate,
  selectedTime,
}: AppointmentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de tu cita</CardTitle>
        <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Image
              src={selectedService?.image_url || '/img/appointments-default.svg'}
              alt={selectedService?.name || ''}
              width={96}
              height={96}
              className="object-cover w-14 h-14 rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{selectedService?.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedService?.duration_minutes} minutos • {selectedService && formatCurrency(selectedService.price)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Profesional:</span>
              <span className="font-medium">{professional.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">{selectedService && formatCurrency(selectedService.price)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
