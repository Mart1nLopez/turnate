import ScrollReveal from '@/components/home/ScrollReveal';
import { VERTICALS_PLURAL } from '@/lib/verticals';

export default function Verticals() {
  return (
    <section className="border-y border-border/60 bg-muted/40 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <p className="text-sm font-medium text-muted-foreground shrink-0">Hecho para profesionales de:</p>
          <div className="flex flex-wrap gap-2">
            {VERTICALS_PLURAL.map((vertical) => (
              <span
                key={vertical}
                className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground/80"
              >
                {vertical}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
