import Image from 'next/image';

export default function DashboardMockup() {
  return (
    <>
      {/* Versión Desktop - Solo visible en pantallas medianas y grandes */}
      <div className="hidden md:block relative h-[400px] w-full perspective-1000">
        <div className="relative w-full h-full rotate-y-12 dashboard-shadow rounded-xl overflow-hidden transition-all duration-500 hover:rotate-y-8 hover:scale-105">
          <Image src="/dashboard.svg" alt="Dashboard de Turnate" fill className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none"></div>
          <div className="absolute inset-0 ring-1 ring-white/20 rounded-xl pointer-events-none"></div>
        </div>
      </div>

      {/* Versión Móvil - Solo visible en pantallas pequeñas */}
      <div className="md:hidden flex items-center justify-center min-h-[420px] perspective-1000">
        {/* iPhone 15 Container con efecto 3D - Tamaño reducido manteniendo proporción */}
        <div className="relative w-56 h-[460px] rotate-y-12 transition-all duration-500 hover:rotate-y-8 hover:scale-105">
          <div className="relative w-full h-full rounded-[35px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-[6px] border-zinc-900">
            {/* Dynamic Island */}
            <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-[70px] h-[18px] bg-zinc-900 rounded-full z-20"></div>

            <div className="absolute -inset-[1px] border-[2px] border-zinc-700 border-opacity-40 rounded-[30px] pointer-events-none"></div>

            {/* Screen Content */}
            <div className="relative w-full h-full rounded-[29px] overflow-hidden flex items-center justify-center bg-white">
              <Image
                src="/dashboard-movil.svg"
                alt="Dashboard de Turnate en móvil"
                fill
                className="object-cover object-center"
                priority
              />
            </div>

            {/* Left Side Buttons */}
            {/* Silent Switch */}
            <div className="absolute left-[-10px] top-16 w-[5px] h-6 bg-zinc-900 rounded-l-md shadow-md"></div>

            {/* Volume Up */}
            <div className="absolute left-[-10px] top-28 w-[5px] h-9 bg-zinc-900 rounded-l-md shadow-md"></div>

            {/* Volume Down */}
            <div className="absolute left-[-10px] top-40 w-[5px] h-9 bg-zinc-900 rounded-l-md shadow-md"></div>

            {/* Right Side Button (Power) */}
            <div className="absolute right-[-10px] top-28 w-[5px] h-12 bg-zinc-900 rounded-r-md shadow-md"></div>
          </div>

          {/* Gradiente de profundidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-[35px] pointer-events-none"></div>
        </div>
      </div>
    </>
  );
}
