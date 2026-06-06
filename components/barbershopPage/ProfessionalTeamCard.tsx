import Link from 'next/link';
import Image from 'next/image';
import { TeamMember, BarbershopMemberRole } from '@/types';

interface ProfessionalTeamCardProps {
  member: TeamMember;
}

const ROLE_LABELS: Record<BarbershopMemberRole, string> = {
  owner:  'Fundador',
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
      */}
      <article
        className="rounded-2xl p-6 h-full flex flex-col border border-[var(--bb-border)] hover:border-[var(--bb-accent-ring)] transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'var(--bb-card)' }}
      >
        {/* ── Top row: avatar + role badge ───────────────────────────────── */}
        <div className="flex items-start justify-between mb-5">

          {/* Avatar */}
          {professional.profileImage ? (
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 0 0 2px var(--bb-accent-ring)' }}
            >
              <Image
                src={professional.profileImage}
                alt={`Foto de ${professional.name}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--bb-bg)',
                boxShadow:  '0 0 0 2px var(--bb-accent-ring)',
              }}
            >
              <span
                className="text-xl font-bold select-none"
                style={{ color: 'var(--bb-accent)' }}
              >
                {initial}
              </span>
            </div>
          )}

          {/* Role badge */}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background:  'var(--bb-accent-sub)',
              color:       'var(--bb-accent)',
              border:      '1px solid var(--bb-accent-sub)',
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/*
          Name — uses Tailwind arbitrary-var class for both base AND hover so that
          group-hover: (pseudo-class) wins over the same-specificity base class.
        */}
        <h3 className="text-lg font-bold leading-snug mb-2 break-words transition-colors duration-200 text-[var(--bb-text)] group-hover:text-[var(--bb-accent)]">
          {professional.name}
        </h3>

        {/* Bio */}
        {professional.bio ? (
          <p
            className="text-sm line-clamp-2 flex-1 mb-5 break-words leading-relaxed"
            style={{ color: 'var(--bb-muted)' }}
          >
            {professional.bio}
          </p>
        ) : (
          <div className="flex-1 mb-5" />
        )}

        {/* CTA */}
        <div
          className="border-t pt-4"
          style={{ borderColor: 'var(--bb-border)' }}
        >
          <span
            className="flex items-center justify-center w-full py-2.5 px-4 text-sm font-semibold tracking-wide transition-all duration-200 group-hover:brightness-110"
            style={{
              background:   'var(--bb-accent)',
              color:        'var(--bb-accent-fg)',
              borderRadius: 'var(--bb-radius)',
            }}
          >
            Reservar
          </span>
        </div>
      </article>
    </Link>
  );
}
