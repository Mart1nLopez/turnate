'use client';

import { useState } from 'react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import ScrollReveal from '@/components/home/ScrollReveal';

const faqs = [
  {
    question: '¿Cómo puedo crear mi página profesional?',
    answer:
      'Es muy sencillo. Solo regístrate en nuestra plataforma, completa tu perfil con tu información básica y configura tus servicios. En cuestión de minutos tendrás tu página web lista para compartir y empezar a recibir clientes de manera automática.',
  },
  {
    question: '¿Hay algún costo por usar Turnate?',
    answer:
      '¡Puedes comenzar totalmente gratis! Ofrecemos un plan gratuito perfecto para profesionales independientes. También contamos con planes premium con funciones avanzadas para potenciar aún más tu negocio, pero siempre podrás usar las funciones esenciales sin costo.',
  },
  {
    question: '¿Cómo funciona el sistema de pagos?',
    answer:
      'Turnate facilita la coordinación de las citas, pero los pagos se manejan directamente entre tú y tus clientes. Puedes configurar tus métodos de pago preferidos (transferencia, efectivo, etc.) y las instrucciones se enviarán a tus clientes al confirmar la cita. Nosotros no cobramos comisiones por tus servicios.',
  },
  {
    question: '¿Necesito conocimientos técnicos para usar Turnate?',
    answer:
      'Para nada. Hemos diseñado Turnate pensando en la facilidad de uso. Nuestra interfaz es intuitiva y amigable, guiándote paso a paso. Si sabes enviar un email o usar redes sociales, podrás administrar tu página en Turnate sin problemas.',
  },
  {
    question: '¿Puedo personalizar mi página?',
    answer:
      'Sí, tu página es tu vitrina. Puedes subir tu logo, fotos de tus trabajos, escribir tu propia biografía y descripción de servicios para que refleje fielmente la identidad de tu marca.',
  },
  {
    question: '¿Funciona bien en celulares?',
    answer:
      'Totalmente. Tanto tu panel de administración como la página que ven tus clientes están 100% optimizadas para funcionar perfectamente en cualquier dispositivo móvil, tablet o computador. Podrás gestionar tu negocio desde donde estés.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4">Preguntas frecuentes</h2>
          <p className="text-muted-foreground text-lg">
            Todo lo que necesitas saber para empezar a gestionar tu negocio con Turnate
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="bg-muted/50 rounded-2xl px-6 py-3 md:px-8 md:py-4 border border-border">
          <Accordion>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                title={faq.question}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
