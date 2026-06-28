import type { ThemeId } from '@/types';

// ─── Theme shape ─────────────────────────────────────────────────────────────

export interface BarbershopTheme {
  id: ThemeId;
  name: string;
  description: string;

  // ── CSS custom property values ───────────────────────────────────────────
  // All values are pre-baked strings (hex, rgba, or gradient).
  // CSS vars are injected once at the page root; every component inherits them.

  backgroundColor:  string; // --theme-bg          page background
  cardBackground:   string; // --theme-surface     card / section background
  accentColor:      string; // --theme-accent      primary brand accent (solid hex)
  accentForeground: string; // --theme-accent-fg   text color ON accent bg (button label)
  accentSubtle:     string; // --theme-accent-sub  accent at ~10% opacity (icon badges, subtle fills)
  accentRing:       string; // --theme-accent-ring accent at ~40% opacity (avatar / logo ring)
  textColor:        string; // --theme-text        primary body text (solid hex)
  mutedColor:       string; // --theme-muted       secondary / placeholder text (pre-baked rgba)
  borderColor:      string; // --theme-border      subtle borders (pre-baked rgba)
  ghostBorder:      string; // --theme-ghost-br    secondary button border (pre-baked rgba)
  ghostBackground:  string; // --theme-ghost-bg    secondary button resting background (pre-baked rgba)
  ghostHover:       string; // --theme-ghost-hv    secondary button hover background (pre-baked rgba)
  heroOverlay:      string; // --theme-overlay     CSS gradient for cover image overlay
  buttonRadius:     string; // --theme-radius      border-radius for CTAs (px value as string)
}

// ─── Theme registry ──────────────────────────────────────────────────────────
// To add a new theme: append one entry here. Nothing else changes.

export const BARBERSHOP_THEMES: BarbershopTheme[] = [
  // ── 1. Luxury Gold ─────────────────────────────────────────────────────────
  {
    id:               'luxury-gold',
    name:             'Luxury Gold',
    description:      'Oscuro y elegante con acentos dorados',
    backgroundColor:  '#0A0A0A',
    cardBackground:   '#171717',
    accentColor:      '#D4AF37',
    accentForeground: '#0A0A0A',
    accentSubtle:     'rgba(212,175,55,0.1)',
    accentRing:       'rgba(212,175,55,0.4)',
    textColor:        '#F5F5F5',
    mutedColor:       'rgba(245,245,245,0.5)',
    borderColor:      'rgba(245,245,245,0.08)',
    ghostBorder:      'rgba(245,245,245,0.22)',
    ghostBackground:  'rgba(245,245,245,0.05)',
    ghostHover:       'rgba(245,245,245,0.1)',
    heroOverlay:
      'linear-gradient(to bottom,rgba(10,10,10,0.1) 0%,rgba(10,10,10,0.4) 40%,rgba(10,10,10,0.88) 75%,#0A0A0A 100%)',
    buttonRadius: '12px',
  },

  // ── 2. Minimal White ───────────────────────────────────────────────────────
  {
    id:               'minimal-white',
    name:             'Minimal White',
    description:      'Limpio y moderno, tipografía dominante',
    backgroundColor:  '#FFFFFF',
    cardBackground:   '#F5F5F5',
    accentColor:      '#111111',
    accentForeground: '#FFFFFF',
    accentSubtle:     'rgba(17,17,17,0.08)',
    accentRing:       'rgba(17,17,17,0.25)',
    textColor:        '#111111',
    mutedColor:       'rgba(17,17,17,0.45)',
    borderColor:      'rgba(17,17,17,0.1)',
    ghostBorder:      'rgba(17,17,17,0.22)',
    ghostBackground:  'rgba(17,17,17,0.04)',
    ghostHover:       'rgba(17,17,17,0.09)',
    heroOverlay:
      'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.55) 45%,rgba(255,255,255,0.92) 78%,#FFFFFF 100%)',
    buttonRadius: '6px',
  },

  // ── 3. Urban Neon ──────────────────────────────────────────────────────────
  {
    id:               'urban-neon',
    name:             'Urban Neon',
    description:      'Dark con detalles neón vibrantes',
    backgroundColor:  '#0D0D0D',
    cardBackground:   '#141414',
    accentColor:      '#00FF87',
    accentForeground: '#0D0D0D',
    accentSubtle:     'rgba(0,255,135,0.1)',
    accentRing:       'rgba(0,255,135,0.4)',
    textColor:        '#FFFFFF',
    mutedColor:       'rgba(255,255,255,0.45)',
    borderColor:      'rgba(255,255,255,0.07)',
    ghostBorder:      'rgba(255,255,255,0.22)',
    ghostBackground:  'rgba(255,255,255,0.05)',
    ghostHover:       'rgba(255,255,255,0.1)',
    heroOverlay:
      'linear-gradient(to bottom,rgba(13,13,13,0.1) 0%,rgba(13,13,13,0.4) 40%,rgba(13,13,13,0.88) 75%,#0D0D0D 100%)',
    buttonRadius: '9999px',
  },

  // ── 4. Vintage Barber ──────────────────────────────────────────────────────
  {
    id:               'vintage-barber',
    name:             'Vintage Barber',
    description:      'Cálido y clásico con tonos tierra',
    backgroundColor:  '#1C1008',
    cardBackground:   '#271507',
    accentColor:      '#C8874A',
    accentForeground: '#1C1008',
    accentSubtle:     'rgba(200,135,74,0.1)',
    accentRing:       'rgba(200,135,74,0.4)',
    textColor:        '#F0E6D3',
    mutedColor:       'rgba(240,230,211,0.5)',
    borderColor:      'rgba(240,230,211,0.09)',
    ghostBorder:      'rgba(240,230,211,0.22)',
    ghostBackground:  'rgba(240,230,211,0.05)',
    ghostHover:       'rgba(240,230,211,0.1)',
    heroOverlay:
      'linear-gradient(to bottom,rgba(28,16,8,0.1) 0%,rgba(28,16,8,0.4) 40%,rgba(28,16,8,0.88) 75%,#1C1008 100%)',
    buttonRadius: '12px',
  },

  // ── 5. Black Red ───────────────────────────────────────────────────────────
  {
    id:               'black-red',
    name:             'Black Red',
    description:      'Intenso y agresivo con rojo vibrante',
    backgroundColor:  '#0A0A0A',
    cardBackground:   '#171717',
    accentColor:      '#DC2626',
    accentForeground: '#FFFFFF',
    accentSubtle:     'rgba(220,38,38,0.1)',
    accentRing:       'rgba(220,38,38,0.4)',
    textColor:        '#F5F5F5',
    mutedColor:       'rgba(245,245,245,0.5)',
    borderColor:      'rgba(245,245,245,0.08)',
    ghostBorder:      'rgba(245,245,245,0.22)',
    ghostBackground:  'rgba(245,245,245,0.05)',
    ghostHover:       'rgba(245,245,245,0.1)',
    heroOverlay:
      'linear-gradient(to bottom,rgba(10,10,10,0.1) 0%,rgba(10,10,10,0.4) 40%,rgba(10,10,10,0.88) 75%,#0A0A0A 100%)',
    buttonRadius: '12px',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns the theme matching `id`. Falls back to 'luxury-gold' for unknown/null IDs. */
export function getThemeById(id?: string | null): BarbershopTheme {
  return BARBERSHOP_THEMES.find((t) => t.id === id) ?? BARBERSHOP_THEMES[0];
}

/**
 * Returns all CSS custom property values for a theme, ready to spread
 * into a React `style` prop on the page root element.
 *
 * Usage:
 *   <div style={{ ...getThemeCssVars(theme), backgroundColor: theme.backgroundColor }}>
 */
export function getThemeCssVars(theme: BarbershopTheme): Record<string, string> {
  return {
    '--theme-bg':          theme.backgroundColor,
    '--theme-surface':     theme.cardBackground,
    '--theme-accent':      theme.accentColor,
    '--theme-accent-fg':   theme.accentForeground,
    '--theme-accent-sub':  theme.accentSubtle,
    '--theme-accent-ring': theme.accentRing,
    '--theme-text':        theme.textColor,
    '--theme-muted':       theme.mutedColor,
    '--theme-border':      theme.borderColor,
    '--theme-ghost-br':    theme.ghostBorder,
    '--theme-ghost-bg':    theme.ghostBackground,
    '--theme-ghost-hv':    theme.ghostHover,
    '--theme-overlay':     theme.heroOverlay,
    '--theme-radius':      theme.buttonRadius,
  };
}
