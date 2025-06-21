'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Professional } from '@/types';

interface CarruselProps {
  professional: Professional;
}

export default function Carrusel({ professional }: CarruselProps) {
  const [index, setIndex] = useState(0);

  // Use professional images or default images
  const slides =
    professional.carrusel_images && professional.carrusel_images.length > 0 ?
      professional.carrusel_images.map((img) => img.url)
    : ['/img/default-carrusel/cortando.jpg', '/img/default-carrusel/cortando2.webp', '/img/default-carrusel/sala.jpeg'];

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const caption = `Descubre los servicios de ${professional.name}`;

  return (
    <section className="relative w-full h-[calc(100vh-80px)] overflow-hidden z-0">
      <div className="relative w-full h-full">
        {slides.map((slide, i) => (
          <Image
            key={i}
            src={slide}
            alt={`Imagen ${i + 1}`}
            fill
            className={`absolute w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
            }`}
          />
        ))}

        <div className="absolute bottom-0 w-full h-35 bg-gradient-to-t from-black to-transparent flex items-end justify-center z-[2] pointer-events-none pb-5">
          <div className="flex flex-col items-center">
            <span className="text-white text-3xl md:text-4xl font-semibold text-center px-4">{caption}</span>
            <span className="text-white text-lg md:text-xl text-center">Un corte, una nueva versión de ti</span>
          </div>
        </div>

        <button
          className="absolute top-1/2 left-0 transform -translate-y-1/2 text-4xl bg-none border-none text-white cursor-pointer z-[2] px-5 hover:bg-white hover:text-black hover:bg-opacity-90 py-2 rounded-r"
          onClick={prevSlide}>
          &#10094;
        </button>

        <button
          className="absolute top-1/2 right-0 transform -translate-y-1/2 text-4xl bg-none border-none text-white cursor-pointer z-[2] px-5 hover:bg-white hover:text-black hover:bg-opacity-90 py-2 rounded-l"
          onClick={nextSlide}>
          &#10095;
        </button>
      </div>
    </section>
  );
}
