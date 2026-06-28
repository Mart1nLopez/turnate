import { TeamMember } from '@/types';
import ProfessionalTeamCard from './ProfessionalTeamCard';

interface TeamGridProps {
  team: TeamMember[];
}

export default function TeamGrid({ team }: TeamGridProps) {
  return (
    <section
      id="equipo"
      className="py-20 sm:py-28 px-6 w-full"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14 sm:mb-16">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--theme-accent)' }}
          >
            El equipo
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Profesionales que
            <br className="hidden sm:block" />
            {' '}cuidan tu estilo
          </h2>
          {/* Accent divider under heading */}
          <div
            className="w-10 h-px mb-5"
            style={{ background: 'var(--theme-accent)', opacity: 0.45 }}
            aria-hidden="true"
          />
          <p
            className="text-base sm:text-lg max-w-md leading-relaxed"
            style={{ color: 'var(--theme-muted)' }}
          >
            Elige al profesional de tu preferencia y agenda en segundos.
          </p>
        </div>

        {team.length === 0 ? (
          /* Empty state — minimal, unobtrusive */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Single thin accent line as decorative element */}
            <div
              className="w-12 h-px mb-8"
              style={{ background: 'var(--theme-accent)', opacity: 0.3 }}
              aria-hidden="true"
            />
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--theme-muted)' }}
            >
              Próximamente
            </p>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: 'var(--theme-muted)', opacity: 0.5 }}
            >
              El equipo de profesionales estará disponible en breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {team.map((member) => (
              <ProfessionalTeamCard key={member.memberId} member={member} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
