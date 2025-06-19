import React from 'react';

interface TestimonialCardProps {
  name: string;
  business: string;
  testimonial: string;
}

const TestimonialCard = ({ name, business, testimonial }: TestimonialCardProps) => {
  // Función para generar iniciales a partir del nombre
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2); // Toma solo las primeras 2 iniciales si hay más de dos palabras
  };

  const initials = getInitials(name);

  return (
    <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className="absolute inset-0 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
            {initials}
          </div>
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm">{business}</p>
        </div>
      </div>
      <p className="italic">{testimonial}</p>
    </div>
  );
};

export default TestimonialCard;
