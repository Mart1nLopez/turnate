'use client';

import Image from 'next/image';
import { SocialButtons } from '@/components/ui/social-buttons';

export default function Footer() {
  return (
    <footer className="pt-8 pb-4 bg-gray-50 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Social links */}
          <div className="text-center md:text-left">
            {/* Logo y nombre de Turnate */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-2xl font-bold text-foreground">Turnate</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Síguenos</h3>
              <SocialButtons
                socials={[
                  { platform: 'twitter', url: 'https://www.twitter.com/turnate' },
                  { platform: 'instagram', url: 'https://www.instagram.com/turnate' },
                  { platform: 'youtube', url: 'https://www.youtube.com/turnate' },
                  { platform: 'linkedin', url: 'https://www.linkedin.com/company/turnate' },
                ]}
                size="md"
                className="justify-center md:justify-start"
              />
            </div>
          </div>

          {/* CTA section */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-semibold text-foreground mb-2">¿Eres profesional?</h3>
            <p className="text-muted-foreground mb-4">Obtén tu propia página para tus clientes</p>
            <div className="flex justify-center md:justify-end">
              <a
                href="mailto:contact@turnate.cl"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 sm:px-6">
                Contáctanos
              </a>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Turnate. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
