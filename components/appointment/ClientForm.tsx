import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TbUser, TbMail, TbPhone } from 'react-icons/tb';

interface ClientFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}

export default function ClientForm({ formData, onChange, onBack, onSubmit, submitting, error }: ClientFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus datos</CardTitle>
        <CardDescription>Completa tu información para confirmar la cita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
          <div className="relative">
            <TbUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Tu nombre completo"
              className="pl-10"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <div className="relative">
            <TbMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              placeholder="tu@email.com"
              className="pl-10"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
          <div className="relative">
            <TbPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onChange}
              placeholder="+56 9 1234 5678"
              className="pl-10"
              required
            />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Volver
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name || !formData.email || !formData.phone || submitting}
            className="flex-1">
            {submitting ? 'Confirmando...' : 'Confirmar Cita'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
