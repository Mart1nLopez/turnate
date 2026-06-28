interface Props {
  visible: boolean;
}

export default function HeroOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, var(--theme-bg) 0%, var(--theme-bg) 5%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(to right, var(--theme-bg) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 95%, var(--theme-accent-sub) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />
    </>
  );
}
