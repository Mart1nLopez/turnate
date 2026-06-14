'use client';

import { useState } from 'react';

interface MapEmbedProps {
  src: string;
  title: string;
}

export default function MapEmbed({ src, title }: MapEmbedProps) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <iframe
      src={src}
      width="100%"
      height="360"
      className="block w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={title}
      allowFullScreen
      onError={() => setHidden(true)}
    />
  );
}
