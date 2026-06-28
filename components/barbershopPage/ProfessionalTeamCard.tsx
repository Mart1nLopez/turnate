import Link from 'next/link';
import Image from 'next/image';
import { TeamMember, BarbershopMemberRole } from '@/types';

interface ProfessionalTeamCardProps {
  member: TeamMember;
}

const ROLE_LABELS: Record<BarbershopMemberRole, string> = {
  owner:  'Fundador',
  admin:  'Barbero',
  barber: 'Barbero',
};

export default function ProfessionalTeamCard({ member }: ProfessionalTeamCardProps) {
  const { professional, role } = member;
  const initial   = professional.name.charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[role];

  return (
    <Link href={`/${professional.slug}`} className="group block h-full">
      {/*
        Border color uses Tailwind arbitrary-var classes so that :hover can override
        the base borderColor without inline-style specificity conflicts.
        Glow on hover via shadow-[...] with CSS var — supported in Tailwind v4.
      */}
      <article
        className="rounded-2xl p-7 h-full flex flex-col border border-[var(--theme-border)] hover:border-[var(--theme-accent-ring)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_var(--theme-accent-ring)]"
        style={{ background: 'var(--theme-surface)' }}
      >
        {/* ── Top row: avatar + role badge ───────────────────────────────── */}
        <div className="flex items-start justify-between mb-5">

          {/* Avatar — 80 × 80px for visual prominence */}
          {professional.profileImage ? (
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 0 0 2px var(--theme-accent-ring)' }}
            >
              <Image
                src={professional.profileImage}
                alt={`Foto de ${professional.name}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--theme-bg)',
                boxShadow:  '0 0 0 2px var(--theme-accent-ring)',
              }}
            >
              <span
                className="text-2xl font-bold select-none"
                style={{ color: 'var(--theme-accent)' }}
              >
                {initial}
              </span>
            </div>
          )}

          {/* Role badge */}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1"
            style={{
              background: 'var(--theme-accent-sub)',
              color:      'var(--theme-accent)',
              border:     '1px solid var(--theme-accent-ring)',
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold leading-snug mb-2 break-words transition-colors duration-200 text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
          {professional.name}
        </h3>

        {/* Bio */}
        {professional.bio ? (
          <p
            className="text-sm line-clamp-2 flex-1 mb-6 break-words leading-relaxed"
            style={{ color: 'var(--theme-muted)' }}
          >
            {professional.bio}
          </p>
        ) : (
          <div className="flex-1 mb-6" />
        )}

        {/* CTA */}
        <div
          className="border-t pt-5"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <span
            className="flex items-center justify-between w-full py-2.5 px-4 text-sm font-semibold tracking-wide transition-all duration-200 group-hover:brightness-110"
            style={{
              background:   'var(--theme-accent)',
              color:        'var(--theme-accent-fg)',
              borderRadius: 'var(--theme-radius)',
            }}
          >
            Reservar
            {/* Arrow icon — reinforces clickability */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}
