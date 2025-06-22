import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Service } from '@/types';

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
}

interface DateCalendarProps {
  currentMonth: Date;
  getDaysInMonth: (date: Date) => Day[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  formatMonthYear: (date: Date) => string;
  selectedService: Service | null;
}

export default function DateCalendar({
  currentMonth,
  getDaysInMonth,
  selectedDate,
  onDateSelect,
  navigateMonth,
  formatMonthYear,
  selectedService,
}: DateCalendarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fecha</CardTitle>
        <CardDescription>Elige el día de tu cita</CardDescription>
      </CardHeader>
      <CardContent className='m-4'>
        <div id="calendar-section">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              ←
            </button>
            <h3 className="text-lg font-semibold capitalize">{formatMonthYear(currentMonth)}</h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((day) => (
              <div
                key={day}
                className="flex items-center justify-center text-s font-medium text-gray-500 py-2"
                style={{ width: '40px' }}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, index) => {
              // Crear una clave única que incluya el índice para evitar duplicados
              const dayString = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
              const selectedString =
                selectedDate ?
                  `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                : null;
              const isSelected = selectedString === dayString;
              const isClickable = day.isAvailable && selectedService && day.isCurrentMonth;

              // Construir clases de manera más controlada
              let buttonClasses =
                'flex items-center justify-center text-s rounded-full font-medium border border-transparent w-10 h-10 transition-colors duration-150';

              // Estado base
              if (!day.isCurrentMonth) {
                buttonClasses += ' text-gray-300 cursor-not-allowed';
              } else if (!day.isAvailable || !selectedService) {
                buttonClasses += ' text-gray-400 cursor-not-allowed bg-gray-50';
              } else {
                buttonClasses += ' cursor-pointer hover:bg-blue-50 hover:text-blue-600';
              }

              // Estados especiales (solo si es del mes actual)
              if (day.isCurrentMonth) {
                if (isSelected) {
                  buttonClasses =
                    'flex items-center justify-center text-sm rounded-full font-medium border border-transparent w-10 h-10 bg-blue-500 text-white shadow-md';
                } else if (day.isToday) {
                  buttonClasses += ' ring-2 ring-blue-300 font-bold';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => isClickable && onDateSelect(day.date)}
                  disabled={!isClickable}
                  className={buttonClasses}
                  type="button">
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
