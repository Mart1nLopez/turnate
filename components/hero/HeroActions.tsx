import Link from 'next/link';

interface CTA {
  label: string;
  href: string;
}

interface Props {
  primary: CTA;
  secondary: CTA;
  microcopy: string;
  hasMetadata: boolean;
  delay?: string;
}

function ArrowRight() {
  return (
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
  );
}

function ChevronDown() {
  return (
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const PRIMARY_CLASS =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98] w-full sm:w-auto';

export default function HeroActions({
  primary,
  secondary,
  microcopy,
  hasMetadata,
  delay = '300ms',
}: Props) {
  const isScroll       = primary.href.startsWith('#');
  const microcopyDelay = `${parseInt(delay) + 80}ms`;

  return (
    <>
      <div
        className={`flex flex-col sm:flex-row gap-3 turnate-animate ${hasMetadata ? 'mt-7 sm:mt-8' : 'mt-4'}`}
        style={{ '--delay': delay } as React.CSSProperties}
      >
        {isScroll ? (
          <a
            href={primary.href}
            className={PRIMARY_CLASS}
            style={{
              background:   'var(--theme-accent)',
              color:        'var(--theme-accent-fg)',
              borderRadius: 'var(--theme-radius)',
            }}
          >
            {primary.label}
            <ArrowRight />
          </a>
        ) : (
          <Link
            href={primary.href}
            className={PRIMARY_CLASS}
            style={{
              background:   'var(--theme-accent)',
              color:        'var(--theme-accent-fg)',
              borderRadius: 'var(--theme-radius)',
            }}
          >
            {primary.label}
            <ArrowRight />
          </Link>
        )}

        <a
          href={secondary.href}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] w-full sm:w-auto bg-[var(--theme-ghost-bg)] hover:bg-[var(--theme-ghost-hv)]"
          style={{
            border:       '1px solid var(--theme-ghost-br)',
            color:        'var(--theme-text)',
            borderRadius: 'var(--theme-radius)',
          }}
        >
          {secondary.label}
          <ChevronDown />
        </a>
      </div>

      <div
        className="mt-3 turnate-animate"
        style={{ '--delay': microcopyDelay } as React.CSSProperties}
      >
        <p
          className="text-xs"
          style={{ color: 'var(--theme-muted)', opacity: 0.6 }}
        >
          {microcopy}
        </p>
      </div>
    </>
  );
}
