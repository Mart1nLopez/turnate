import Image from 'next/image';

interface Props {
  imageUrl?: string;
  name: string;
  shape?: 'circle' | 'rounded';
  sizeClass?: string;
  delay?: string;
}

export default function HeroAvatar({
  imageUrl,
  name,
  shape = 'circle',
  sizeClass = 'w-12 h-12 sm:w-16 sm:h-16',
  delay = '0ms',
}: Props) {
  const initial    = name.charAt(0).toUpperCase();
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      className="mb-5 sm:mb-6 turnate-scale"
      style={{ '--delay': delay } as React.CSSProperties}
    >
      {imageUrl ? (
        <div
          className={`${sizeClass} ${shapeClass} overflow-hidden`}
          style={{
            boxShadow:
              '0 0 0 2px var(--theme-accent-ring), 0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <Image
            src={imageUrl}
            alt={`Foto de ${name}`}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      ) : (
        <div
          className={`${sizeClass} ${shapeClass} flex items-center justify-center`}
          style={{
            background: 'var(--theme-surface)',
            boxShadow:
              '0 0 0 2px var(--theme-accent-ring), 0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <span
            className="text-lg sm:text-xl font-bold select-none"
            style={{ color: 'var(--theme-accent)' }}
          >
            {initial}
          </span>
        </div>
      )}
    </div>
  );
}
