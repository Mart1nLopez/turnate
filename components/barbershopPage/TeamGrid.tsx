import { TbUsers } from 'react-icons/tb';
import { TeamMember } from '@/types';
import ProfessionalTeamCard from './ProfessionalTeamCard';

interface TeamGridProps {
  team: TeamMember[];
}

export default function TeamGrid({ team }: TeamGridProps) {
  return (
    <section
      id="equipo"
      className="py-20 sm:py-24 px-6 w-full"
      style={{ background: 'var(--bb-bg)' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-3"
            style={{ color: 'var(--bb-accent)' }}
          >
            El equipo
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: 'var(--bb-text)' }}
          >
            Profesionales que
            <br className="hidden sm:block" />
            {' '}cuidan tu estilo
          </h2>
          <p
            className="text-base sm:text-lg mt-4 max-w-lg leading-relaxed"
            style={{ color: 'var(--bb-muted)' }}
          >
            Elige al profesional de tu preferencia y agenda en segundos.
          </p>
        </div>

        {team.length === 0 ? (
          /* Empty state */
          <div
            className="max-w-sm mx-auto rounded-2xl p-12 text-center border"
            style={{ background: 'var(--bb-card)', borderColor: 'var(--bb-border)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--bb-accent-sub)' }}
            >
              <TbUsers className="w-7 h-7" style={{ color: 'var(--bb-accent)', opacity: 0.5 }} />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: 'var(--bb-muted)' }}
            >
              Sin miembros activos
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--bb-muted)', opacity: 0.6 }}
            >
              Esta barbería aún no ha agregado miembros a su equipo.
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
