import React from 'react';
import { TbBrandInstagram, TbBrandWhatsapp, TbBrandFacebook } from 'react-icons/tb';
import { FaTiktok, FaYoutube, FaTwitter, FaLinkedin } from 'react-icons/fa';

export type SocialPlatform = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin';

export interface SocialButton {
  platform: SocialPlatform;
  url: string;
}

interface SocialButtonsProps {
  socials: SocialButton[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap = {
  instagram: TbBrandInstagram,
  whatsapp: TbBrandWhatsapp,
  facebook: TbBrandFacebook,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
};

const colorMap: Record<SocialPlatform, string> = {
  instagram: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500',
  whatsapp: 'hover:bg-green-500',
  facebook: 'hover:bg-blue-600',
  tiktok: 'hover:bg-black',
  youtube: 'hover:bg-red-600',
  twitter: 'hover:bg-blue-500',
  linkedin: 'hover:bg-blue-700',
};

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export const SocialButtons: React.FC<SocialButtonsProps> = ({ socials, size = 'md', className = '' }) => {
  return (
    <div className={`flex gap-4 ${className}`}>
      {socials.map(({ platform, url }) => {
        const Icon = iconMap[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-all duration-300 hover:text-white hover:scale-110 ${sizeMap[size]} ${colorMap[platform]}`}
            aria-label={`Seguir en ${platform}`}>
            <Icon
              className={
                size === 'sm' ? 'w-4 h-4'
                : size === 'lg' ?
                  'w-7 h-7'
                : 'w-5 h-5'
              }
            />
          </a>
        );
      })}
    </div>
  );
};

export default SocialButtons;
