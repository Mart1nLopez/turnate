import { Service } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { TbClock } from 'react-icons/tb';
import { formatCurrency } from '@/lib/utils';

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

export default function ServiceSelector({ services, selectedService, onSelect }: ServiceSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios</CardTitle>
        <CardDescription>Selecciona el servicio que necesitas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-90 overflow-y-auto">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelect(service)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedService?.id === service.id ?
                  'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
              }`}>
              <div className="flex items-center gap-3">
                <div className="relative bg-blue-100 rounded flex items-center justify-center">

                  <Image
                    src={service.image_url || '/img/appointments-default.svg'}
                    alt={service.name}
                    width={256}
                    height={256}
                    className="object-cover w-14 h-14 rounded"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="font-medium text-green-600">{formatCurrency(service.price)}</span>
                    <span className="flex items-center">
                      <TbClock className="w-3 h-3 mr-1" />
                      {service.duration_minutes}min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
