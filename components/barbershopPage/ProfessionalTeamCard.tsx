import Link from 'next/link';
import Image from 'next/image';
import { TeamMember } from '@/types';

interface ProfessionalTeamCardProps {
  member: TeamMember;
}

export default function ProfessionalTeamCard({ member }: ProfessionalTeamCardProps) {
  const { professional, role } = member;
  const initial = professional.name.charAt(0).toUpperCase();

  return (
    <Link href={`/${professional.slug}`} className="group block h-full">
      <article className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 h-full flex flex-col items-center text-center">

        {/* Avatar */}
        {professional.profileImage ? (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-100 mb-4 flex-shrink-0">
            <Image
              src={professional.profileImage}
              alt={`Foto de ${professional.name}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-4 flex-shrink-0">
            <span className="text-white text-2xl font-bold select-none">{initial}</span>
          </div>
        )}

        {/* Role badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${
            role === 'owner'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {role === 'owner' ? 'Dueño' : 'Barbero'}
        </span>

        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug w-full break-words">
          {professional.name}
        </h3>

        {/* Bio */}
        {professional.bio && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4 w-full break-words">
            {professional.bio}
          </p>
        )}

        {/* CTA — sin botón de reserva */}
        <div className="mt-auto pt-3 border-t border-gray-100 w-full">
          <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
            Ver perfil →
          </span>
        </div>

      </article>
    </Link>
  );
}
