'use client';

import { BarbershopTheme } from '@/lib/barbershopThemes';
import { TbCheck } from 'react-icons/tb';

interface ThemeThumbnailProps {
  theme: BarbershopTheme;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Mini landing-page preview card — Canva / Shopify style.
 * Renders a thumbnail that visually represents the theme using inline styles
 * (NOT CSS vars — this runs in the dashboard context without the bb-* vars).
 */
export default function ThemeThumbnail({
  theme,
  isSelected,
  onClick,
  disabled = false,
}: ThemeThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Seleccionar tema ${theme.name}`}
      aria-pressed={isSelected}
      className="relative w-full text-left rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group"
      style={{
        boxShadow: isSelected
          ? `0 0 0 3px ${theme.accentColor}`
          : '0 0 0 1px rgba(0,0,0,0.12)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {/* ── Active checkmark badge ───────────────────────────────────────── */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: theme.accentColor }}
        >
          <TbCheck
            className="w-3.5 h-3.5"
            style={{ color: theme.accentForeground }}
            strokeWidth={3}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MINI HERO (h-20)                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative h-20 flex flex-col justify-end px-3 pb-2 overflow-hidden"
        style={{ background: theme.backgroundColor }}
      >
        {/* Background accent glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 15% 30%, ${theme.accentSubtle} 0%, transparent 65%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${theme.backgroundColor} 20%, transparent 100%)`,
          }}
        />

        {/* Mini logo + name row */}
        <div className="relative z-10 flex items-center gap-1.5 mb-1.5">
          {/* Logo placeholder */}
          <div
            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: theme.accentSubtle, border: `1px solid ${theme.accentRing}` }}
          >
            <span
              className="text-[7px] font-bold leading-none"
              style={{ color: theme.accentColor }}
            >
              B
            </span>
          </div>
          {/* Name mock lines */}
          <div className="flex flex-col gap-0.5">
            <div
              className="h-[5px] rounded-full"
              style={{ width: 44, background: theme.textColor, opacity: 0.85 }}
            />
          </div>
        </div>

        {/* Mini CTA button */}
        <div
          className="relative z-10 h-5 flex items-center justify-center rounded self-start px-3"
          style={{
            background:   theme.accentColor,
            color:        theme.accentForeground,
            fontSize:     8,
            fontWeight:   700,
            borderRadius: parseInt(theme.buttonRadius) > 12 ? '9999px' : '4px',
          }}
        >
          Reservar
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MINI TRUST STRIP (h-7)                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center gap-2 px-3"
        style={{
          height:     28,
          background: theme.cardBackground,
          borderTop:  `1px solid ${theme.borderColor}`,
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            {/* Icon dot */}
            <div
              className="w-2.5 h-2.5 rounded"
              style={{ background: theme.accentSubtle }}
            >
              <div
                className="w-full h-full rounded flex items-center justify-center"
                style={{ background: theme.accentColor, opacity: 0.7 }}
              />
            </div>
            {/* Label mock line */}
            <div
              className="h-[4px] rounded-full"
              style={{ width: 20 + i * 6, background: theme.mutedColor }}
            />
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MINI TEAM CARD (h-11)                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center gap-2 px-3"
        style={{
          height:      44,
          background:  theme.backgroundColor,
          borderTop:   `1px solid ${theme.borderColor}`,
          paddingTop:   8,
          paddingBottom: 8,
        }}
      >
        {/* Avatar circle */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{
            background: theme.accentSubtle,
            boxShadow:  `0 0 0 1.5px ${theme.accentRing}`,
          }}
        >
          <span className="text-[7px] font-bold" style={{ color: theme.accentColor }}>
            P
          </span>
        </div>

        {/* Name + role mocks */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div
            className="h-[4px] rounded-full"
            style={{ width: 36, background: theme.textColor, opacity: 0.8 }}
          />
          <div
            className="h-[3px] rounded-full"
            style={{ width: 24, background: theme.mutedColor }}
          />
        </div>

        {/* Mini reserve button */}
        <div
          className="h-5 flex items-center justify-center px-2 flex-shrink-0"
          style={{
            background:   theme.accentColor,
            color:        theme.accentForeground,
            fontSize:     7,
            fontWeight:   700,
            borderRadius: parseInt(theme.buttonRadius) > 12 ? '9999px' : '3px',
          }}
        >
          Reservar
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LABEL                                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="px-3 py-2.5 bg-white border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{theme.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{theme.description}</p>
      </div>
    </button>
  );
}
