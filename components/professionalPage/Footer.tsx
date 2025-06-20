'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-2xl font-bold text-foreground">Turnate</span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-4">Síguenos</h3>
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

          {/* CTA section */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-semibold text-foreground mb-2">¿Eres profesional?</h3>
            <p className="text-muted-foreground mb-4">Obtén tu propia página para tus clientes</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm md:ml-auto">
              <Input type="email" placeholder="tu@email.com" className="flex-1" />
              <Button className="sm:px-6">Contáctanos</Button>
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
