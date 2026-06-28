import Image from 'next/image';

interface Member {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Props {
  members: Member[];
  max?: number;
}

export default function StackedAvatars({ members, max = 4 }: Props) {
  const visible  = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex items-center">
      {visible.map((member, i) =>
        member.imageUrl ? (
          <div
            key={member.id}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0"
            style={{
              marginLeft: i > 0 ? '-8px' : '0',
              boxShadow: '0 0 0 2px var(--theme-bg)',
            }}
          >
            <Image
              src={member.imageUrl}
              alt={member.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            key={member.id}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{
              marginLeft: i > 0 ? '-8px' : '0',
              background: 'var(--theme-surface)',
              color: 'var(--theme-accent)',
              boxShadow: '0 0 0 2px var(--theme-bg)',
            }}
          >
            {member.name.charAt(0)}
          </div>
        ),
      )}
      {overflow > 0 && (
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
          style={{
            marginLeft: '-8px',
            background: 'var(--theme-accent-sub)',
            color: 'var(--theme-accent)',
            boxShadow: '0 0 0 2px var(--theme-bg)',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
