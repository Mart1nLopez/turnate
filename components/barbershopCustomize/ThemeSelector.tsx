'use client';

import { TbColorPicker } from 'react-icons/tb';
import { BARBERSHOP_THEMES } from '@/lib/barbershopThemes';
import { ThemeId } from '@/types';
import ThemeThumbnail from './ThemeThumbnail';

interface ThemeSelectorProps {
  selectedTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
  saving: boolean;
}

/**
 * Grid of visual theme cards.
 * Automatically renders all themes from BARBERSHOP_THEMES — adding a new theme
 * to the array is the only change needed.
 */
export default function ThemeSelector({
  selectedTheme,
  onSelect,
  saving,
}: ThemeSelectorProps) {
  return (
    <div>
      {/* Theme grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

        {/* Render all registered themes */}
        {BARBERSHOP_THEMES.map((theme) => (
          <ThemeThumbnail
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            onClick={() => !saving && onSelect(theme.id)}
            disabled={saving}
          />
        ))}

        {/* ── "Personalizar colores" — visible but disabled ─────────────── */}
        <button
          type="button"
          disabled
          aria-label="Personalizar colores — próximamente"
          className="relative w-full text-left rounded-2xl overflow-hidden cursor-not-allowed opacity-60"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }}
        >
          {/* Próximamente badge */}
          <div className="absolute top-2 right-2 z-20">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900 text-white">
              Próximamente
            </span>
          </div>

          {/* Mini preview — multi-color gradient to suggest "custom" */}
          <div
            className="h-20"
            style={{
              background:
                'linear-gradient(135deg, #D4AF37 0%, #DC2626 30%, #00FF87 60%, #C8874A 100%)',
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              <TbColorPicker className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>

          {/* Trust + Team mocks in neutral gray */}
          <div className="h-7 bg-gray-100 border-t border-gray-200" />
          <div className="h-11 bg-white border-t border-gray-100" />

          {/* Label */}
          <div className="px-3 py-2.5 bg-white border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              Personalizar colores
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              Elige tus propios colores
            </p>
          </div>
        </button>

      </div>

      {/* Saving indicator */}
      {saving && (
        <p
          className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"
          aria-live="polite"
          role="status"
        >
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" aria-hidden="true" />
          Guardando tema…
        </p>
      )}
    </div>
  );
}
