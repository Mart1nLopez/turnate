import React from 'react';

interface TestimonialCardProps {
  name: string;
  business: string;
  testimonial: string;
  featured?: boolean;
}

const TestimonialCard = ({ name, business, testimonial, featured = false }: TestimonialCardProps) => {
  const initials = name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      className={`h-full rounded-2xl border border-border bg-card p-6 md:p-7 flex flex-col ${
        featured ? 'justify-between' : 'justify-center'
      }`}
    >
      <p
        className={`text-foreground/90 ${featured ? 'text-xl md:text-2xl leading-snug' : 'text-base leading-relaxed'}`}
      >
        &ldquo;{testimonial}&rdquo;
      </p>

      <div className={`flex items-center gap-3 ${featured ? 'mt-8' : 'mt-4'}`}>
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
          {initials}
        </div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-sm text-muted-foreground">{business}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
