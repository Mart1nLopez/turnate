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
    professional.profile_images && professional.profile_images.length > 0 ?
      professional.profile_images.map((img) => img.url)
    : [
        'https://reservoimg.s3.amazonaws.com/fotos_blog/4aab7f1c-e_foto_blog.jpg',
        'https://i0.wp.com/hairinmotion.co.uk/wp-content/uploads/2022/12/tecnicas-basicas-de-barberia-scaled.jpg',
        'https://images.fresha.com/locations/location-profile-images/1119325/4171739/ecc5b582-ba58-4dea-8b37-ec6c8bbc988a-TorricoStudio-AR-BuenosAires-BuenosAires-Almagro-Fresha.jpg',
      ];

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
          className="absolute top-1/2 left-0 transform -translate-y-1/2 text-[2rem] bg-none border-none text-white cursor-pointer z-[2] px-5 hover:bg-black hover:bg-opacity-20 py-2 rounded-r"
          onClick={prevSlide}>
          &#10094;
        </button>

        <button
          className="absolute top-1/2 right-0 transform -translate-y-1/2 text-[2rem] bg-none border-none text-white cursor-pointer z-[2] px-5 hover:bg-black hover:bg-opacity-20 py-2 rounded-l"
          onClick={nextSlide}>
          &#10095;
        </button>
      </div>
    </section>
  );
}
