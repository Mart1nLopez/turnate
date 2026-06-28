'use client';

import { TbUser } from 'react-icons/tb';

export interface ProfessionalOption {
  id: string;
  name: string;
}

interface ProfessionalFilterProps {
  professionals: ProfessionalOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export default function ProfessionalFilter({
  professionals,
  value,
  onChange,
  disabled = false,
}: ProfessionalFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <TbUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || professionals.length === 0}
        className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <option value="">Todos los barberos</option>
        {professionals.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
