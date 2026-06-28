interface Props {
  delay?: string;
  className?: string;
}

export default function AccentRule({
  delay = '280ms',
  className = 'mb-4',
}: Props) {
  return (
    <div
      className={`h-px turnate-expand ${className}`}
      style={
        {
          background: 'var(--theme-accent)',
          opacity: 0.4,
          '--delay': delay,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}
