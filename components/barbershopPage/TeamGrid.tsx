import { TbUsers } from 'react-icons/tb';
import { TeamMember } from '@/types';
import ProfessionalTeamCard from './ProfessionalTeamCard';

interface TeamGridProps {
  team: TeamMember[];
}

export default function TeamGrid({ team }: TeamGridProps) {
  return (
    <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Nuestro equipo</h2>
          <p className="text-gray-500 text-lg">
            Conoce a los profesionales y agenda con el que prefieras.
          </p>
        </div>

        {team.length === 0 ? (
          <div className="max-w-sm mx-auto bg-white rounded-2xl p-12 text-center shadow-sm">
            <TbUsers className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin miembros activos</h3>
            <p className="text-gray-400 text-sm">Esta barbería aún no ha agregado miembros a su equipo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team.map((member) => (
              <ProfessionalTeamCard key={member.memberId} member={member} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
