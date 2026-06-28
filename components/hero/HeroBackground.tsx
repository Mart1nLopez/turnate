import Image from 'next/image';
import { RefObject } from 'react';

interface Props {
  coverUrl: string | null;
  parallaxRef: RefObject<HTMLDivElement | null>;
}

export default function HeroBackground({ coverUrl, parallaxRef }: Props) {
  if (coverUrl) {
    return (
      <div
        ref={parallaxRef}
        className="absolute inset-0 will-change-transform"
        style={{ top: '-8px', bottom: '-8px' }}
      >
        <Image
          src={coverUrl}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{ background: 'var(--theme-bg)' }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 15% 30%, var(--theme-accent-sub) 0%, transparent 52%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 85% 75%, var(--theme-accent-sub) 0%, transparent 45%)',
          opacity: 0.55,
        }}
      />
    </div>
  );
}
