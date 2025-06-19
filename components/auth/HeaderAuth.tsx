import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between p-2 sm:p-3 md:py-6 lg:px-6">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="mr-2 dark:invert" />
          <span className="text-xl sm:text-2xl font-bold">Turnate</span>
        </Link>
      </div>
    </header>
  );
}
