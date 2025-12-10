export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Turnate',
    url: 'https://turnate.cl',
    logo: 'https://turnate.cl/logo.png',
    sameAs: [
      'https://www.instagram.com/turnate.com_/',
    ],
    description: 'Plataforma integral para gestión de citas para profesionales.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CL'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
