'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { TbX, TbCalendarCheck, TbPhone, TbMapPin } from 'react-icons/tb';
import { Barbershop } from '@/types';
import { BarbershopTheme } from '@/lib/barbershopThemes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  barbershop: Barbershop;
  theme: BarbershopTheme;
  mode: 'compact' | 'fullscreen';
  onClose?: () => void; // required when mode === 'fullscreen'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable metric chip */
function MetricChip({
  icon: Icon,
  value,
  label,
  theme,
}: {
  icon: typeof TbCalendarCheck;
  value: string;
  label: string;
  theme: BarbershopTheme;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0"
      style={{ background: theme.cardBackground, borderColor: theme.borderColor }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: theme.accentSubtle }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
      </div>
      <div>
        <p className="text-xs font-bold leading-none" style={{ color: theme.accentColor }}>
          {value}
        </p>
        <p className="text-[10px] leading-snug mt-0.5" style={{ color: theme.mutedColor }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/** Reusable mock team card */
function MockTeamCard({
  name,
  role,
  initial,
  theme,
}: {
  name: string;
  role: string;
  initial: string;
  theme: BarbershopTheme;
}) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col"
      style={{ background: theme.cardBackground, borderColor: theme.borderColor }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: theme.accentSubtle,
            boxShadow:  `0 0 0 2px ${theme.accentRing}`,
          }}
        >
          <span className="text-sm font-bold" style={{ color: theme.accentColor }}>
            {initial}
          </span>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: theme.accentSubtle, color: theme.accentColor }}
        >
          {role}
        </span>
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: theme.textColor }}>
        {name}
      </p>
      <p className="text-xs mb-3" style={{ color: theme.mutedColor }}>
        Especialista en cortes premium
      </p>
      <div
        className="mt-auto py-2 rounded-lg text-center text-xs font-semibold"
        style={{
          background:   theme.accentColor,
          color:        theme.accentForeground,
          borderRadius: theme.buttonRadius,
        }}
      >
        Reservar
      </div>
    </div>
  );
}

// ─── Preview content (shared between compact and fullscreen) ──────────────────

function PreviewContent({ barbershop, theme, mode }: Omit<Props, 'onClose'>) {
  const initial      = barbershop.name.charAt(0).toUpperCase();
  const hasCover     = !!barbershop.cover_image_url;
  const hasPhone     = !!barbershop.phone;
  const hasLocation  = !!(barbershop.city || barbershop.address);
  const heroHeight   = mode === 'fullscreen' ? 280 : 180;

  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: theme.backgroundColor, fontFamily: 'inherit' }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative flex items-end overflow-hidden" style={{ height: heroHeight }}>
        {/* Background */}
        {hasCover ? (
          <>
            <Image
              src={barbershop.cover_image_url!}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div
              className="absolute inset-0"
              style={{ background: theme.heroOverlay }}
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: theme.backgroundColor }}>
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 20% 30%, ${theme.accentSubtle} 0%, transparent 55%)`,
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 px-5 pb-5 w-full">
          {/* Logo */}
          <div className="mb-3">
            {barbershop.logo_url ? (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  width:     mode === 'fullscreen' ? 52 : 36,
                  height:    mode === 'fullscreen' ? 52 : 36,
                  boxShadow: `0 0 0 2px ${theme.accentRing}`,
                  flexShrink: 0,
                }}
              >
                <Image
                  src={barbershop.logo_url}
                  alt={`Logo de ${barbershop.name}`}
                  width={52}
                  height={52}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  width:      mode === 'fullscreen' ? 52 : 36,
                  height:     mode === 'fullscreen' ? 52 : 36,
                  background: theme.cardBackground,
                  boxShadow:  `0 0 0 2px ${theme.accentRing}`,
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    fontSize: mode === 'fullscreen' ? 20 : 14,
                    color:    theme.accentColor,
                  }}
                >
                  {initial}
                </span>
              </div>
            )}
          </div>

          {/* Eyebrow */}
          <p
            className="font-semibold uppercase mb-1"
            style={{
              fontSize:       mode === 'fullscreen' ? 10 : 8,
              letterSpacing:  '0.2em',
              color:          theme.accentColor,
            }}
          >
            Barbería Premium
          </p>

          {/* Name */}
          <h2
            className="font-bold leading-tight mb-1"
            style={{
              fontSize:  mode === 'fullscreen' ? 26 : 18,
              color:     theme.textColor,
            }}
          >
            {barbershop.name}
          </h2>

          {/* Description — only in fullscreen */}
          {mode === 'fullscreen' && barbershop.description && (
            <p
              className="mb-3 line-clamp-2"
              style={{ fontSize: 12, color: theme.mutedColor, maxWidth: 480 }}
            >
              {barbershop.description}
            </p>
          )}

          {/* CTA row */}
          <div className="flex gap-2 mt-3">
            <div
              className="flex items-center justify-center"
              style={{
                background:   theme.accentColor,
                color:        theme.accentForeground,
                fontSize:     mode === 'fullscreen' ? 11 : 9,
                fontWeight:   700,
                height:       mode === 'fullscreen' ? 32 : 22,
                paddingLeft:  mode === 'fullscreen' ? 14 : 10,
                paddingRight: mode === 'fullscreen' ? 14 : 10,
                borderRadius: theme.buttonRadius,
              }}
            >
              Ver profesionales
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                border:       `1px solid ${theme.ghostBorder}`,
                color:        theme.textColor,
                background:   theme.ghostBackground,
                fontSize:     mode === 'fullscreen' ? 11 : 9,
                fontWeight:   600,
                height:       mode === 'fullscreen' ? 32 : 22,
                paddingLeft:  mode === 'fullscreen' ? 14 : 10,
                paddingRight: mode === 'fullscreen' ? 14 : 10,
                borderRadius: theme.buttonRadius,
              }}
            >
              Información
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST METRICS ────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex gap-3 overflow-x-auto border-b"
        style={{
          background:   theme.backgroundColor,
          borderColor:  theme.borderColor,
          scrollbarWidth: 'none',
        }}
      >
        <MetricChip icon={TbCalendarCheck} value="Online" label="Reservas disponibles" theme={theme} />
        {hasPhone && (
          <MetricChip icon={TbPhone} value="✓" label="Contacto disponible" theme={theme} />
        )}
        {hasLocation && (
          <MetricChip
            icon={TbMapPin}
            value={barbershop.city ?? 'Ver mapa'}
            label="Ubicación"
            theme={theme}
          />
        )}
      </div>

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-5" style={{ background: theme.backgroundColor }}>
        {/* Section header */}
        <p
          className="font-semibold uppercase mb-1"
          style={{ fontSize: 9, letterSpacing: '0.18em', color: theme.accentColor }}
        >
          El equipo
        </p>
        <p
          className="font-bold mb-4"
          style={{ fontSize: mode === 'fullscreen' ? 18 : 14, color: theme.textColor }}
        >
          Profesionales que cuidan tu estilo
        </p>

        {/* Mock cards */}
        <div className={`grid gap-3 ${mode === 'fullscreen' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <MockTeamCard name="Carlos Méndez" role="Fundador" initial="C" theme={theme} />
          <MockTeamCard name="Diego Reyes" role="Barbero" initial="D" theme={theme} />
          {mode === 'fullscreen' && (
            <MockTeamCard name="Sebastián V." role="Barbero" initial="S" theme={theme} />
          )}
        </div>
      </div>

      {/* ── INFO SNIPPET (fullscreen only) ───────────────────────────────── */}
      {mode === 'fullscreen' && (hasPhone || hasLocation) && (
        <div
          className="px-5 py-5 border-t"
          style={{ background: theme.cardBackground, borderColor: theme.borderColor }}
        >
          <p
            className="font-semibold uppercase mb-4"
            style={{ fontSize: 9, letterSpacing: '0.18em', color: theme.accentColor }}
          >
            Visítanos
          </p>
          <div className="flex flex-col gap-2">
            {hasPhone && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: theme.accentSubtle }}
                >
                  <TbPhone className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                </div>
                <span className="text-sm" style={{ color: theme.mutedColor }}>
                  {barbershop.phone}
                </span>
              </div>
            )}
            {hasLocation && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: theme.accentSubtle }}
                >
                  <TbMapPin className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                </div>
                <span className="text-sm" style={{ color: theme.mutedColor }}>
                  {barbershop.address ?? barbershop.city ?? 'Ver mapa'}
                  {barbershop.city && barbershop.address && `, ${barbershop.city}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Live page preview that uses real barbershop data.
 * In 'compact' mode: sidebar panel (no scroll, truncated).
 * In 'fullscreen' mode: rendered as a portal overlay with full detail.
 */
export default function BarbershopPagePreview({ barbershop, theme, mode, onClose }: Props) {
  // Prevent body scroll when fullscreen modal is open
  useEffect(() => {
    if (mode === 'fullscreen') {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mode]);

  // Handle Escape key
  useEffect(() => {
    if (mode !== 'fullscreen' || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, onClose]);

  if (mode === 'compact') {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <PreviewContent barbershop={barbershop} theme={theme} mode="compact" />
      </div>
    );
  }

  // Fullscreen modal via portal
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa — ${theme.name}`}
    >
      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
            Vista previa
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {barbershop.name} — <span className="text-gray-500">{theme.name}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Cerrar vista previa"
        >
          <TbX className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto my-8 rounded-2xl overflow-hidden shadow-2xl">
          <PreviewContent barbershop={barbershop} theme={theme} mode="fullscreen" />
        </div>
        <div className="h-8" />
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-5 py-2.5 bg-white border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Esta es una simulación. La página real puede variar.
        </p>
      </div>
    </div>,
    document.body,
  );
}
