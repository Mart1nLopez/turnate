'use client';

import { TbBrandInstagram } from 'react-icons/tb';
import { FaTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="pt-8 pb-4 bg-gray-50 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Social links */}
          <div className="text-center md:text-left">
            {/* Logo y nombre de Turnate */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-2xl font-bold text-foreground">Turnate</span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-4">Síguenos</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a
                href="https://www.twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Seguir en Twitter">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Seguir en Instagram">
                <TbBrandInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Seguir en YouTube">
                <FaYoutube className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-700 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Seguir en LinkedIn">
                <FaLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* CTA section */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-semibold text-foreground mb-2">¿Eres profesional?</h3>
            <p className="text-muted-foreground mb-4">Obtén tu propia página para agendar servicios</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm md:ml-auto">
              <Input type="email" placeholder="tu@email.com" className="flex-1" />
              <Button className="sm:px-6">Crear página</Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">© 2024 Turnate. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
