import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotSelectorProps {
  selectedDate: Date | null;
  timeSlots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}

export default function TimeSlotSelector({
  selectedDate,
  timeSlots,
  selectedTime,
  onTimeSelect,
  onContinue,
  canContinue,
}: TimeSlotSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios</CardTitle>
        <CardDescription className='text-balance'>
          {selectedDate ?
            `Horarios disponibles para ${selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}`
          : 'Selecciona una fecha para ver horarios'}
        </CardDescription>
      </CardHeader>
      <CardContent id="time-slot-selector">
        <div className='space-y-3'>
          <div className='max-h-70 overflow-y-auto'>
            {!selectedDate ?
              <p className="text-gray-500 text-center py-8">Selecciona una fecha para ver horarios disponibles</p>
            : timeSlots.length === 0 ?
              <p className="text-gray-500 text-center py-8">No hay horarios disponibles para esta fecha</p>
            : <div className="grid grid-cols-3 gap-2 mb-4">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && onTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 text-sm border rounded-lg transition-all ${
                      selectedTime === slot.time ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : slot.available ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}>
                    {slot.time}
                  </button>
                ))}
              </div>
            }
          </div>
          <Button onClick={onContinue} disabled={!canContinue} className="w-full mt-4">
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
