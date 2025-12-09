import Image from 'next/image';

interface DashboardMockupProps {
  desktopImage: string;
  mobileImage: string;
  alt?: string;
  priority?: boolean;
}

export default function DashboardMockup({
  desktopImage,
  mobileImage,
  alt = "Dashboard de Turnate",
  priority = false,
}: DashboardMockupProps) {
  return (
    <>
      {/* Versión Desktop - Solo visible en pantallas medianas y grandes */}
      <div className="hidden md:block w-full perspective-1000">
        <div className="relative w-full max-w-4xl mx-auto aspect-[16/8.8] rotate-y-12 dashboard-shadow rounded-xl overflow-hidden transition-all duration-500 hover:rotate-y-8 hover:scale-105 bg-gray-100">
          <Image src={desktopImage} alt={alt} fill className="object-contain object-top" priority={priority} />
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

            {/* Screen Content - SVG mockup como fondo y dashboard-movil.svg encima */}
            <div className="relative w-full h-full rounded-[29px] overflow-hidden flex items-center justify-center bg-white">
              {/* SVG del mockup como fondo */}
              <svg
                viewBox="0 0 750 1624"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full object-cover object-center z-0"
                preserveAspectRatio="none">
                <rect width={750} height={1624} fill="white" />
                <rect width={750} height={110} fill="white" />
                <rect x={255} y={21} width={240} height={70} rx={35} fill="black" />
                <rect opacity="0.35" x="636.5" y="43.5" width="45.4286" height={25} rx="7.5" stroke="black" />
                <rect x="639.714" y="46.7144" width={39} height="18.5714" rx={6} fill="black" />
                <path
                  opacity="0.35"
                  d="M684.286 52.2861C684.286 52.2861 688 53.0289 688 56.0004C688 58.9718 684.286 59.7146 684.286 59.7146V52.2861Z"
                  fill="black"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M606.451 60.3333C608.845 60.3333 611.011 61.3034 612.58 62.8717L606.451 69L600.323 62.8717C601.892 61.3034 604.058 60.3333 606.451 60.3333ZM606.451 51.6667C611.238 51.6667 615.571 53.6068 618.708 56.7435L615.031 60.4204C612.835 58.2247 609.802 56.8667 606.451 56.8667C603.101 56.8667 600.068 58.2247 597.872 60.4204L594.195 56.7435C597.332 53.6068 601.665 51.6667 606.451 51.6667ZM605.808 43.0078L606.451 43L607.238 43.0117L607.928 43.0412L608.523 43.0813L609.28 43.1521L609.91 43.228L610.593 43.328L611.3 43.4512L612 43.5934L612.609 43.7334L613.32 43.9169L614.048 44.1273L614.547 44.2851L615.093 44.4706L615.681 44.6857L616.332 44.9434L616.974 45.2175L617.569 45.4902L618.148 45.7733L618.718 46.07L619.272 46.3757L619.803 46.6857L620.374 47.0377L620.934 47.4039L621.455 47.7633L621.928 48.1057L622.553 48.5845L623.015 48.958L623.478 49.3505L623.998 49.8132L624.544 50.3275L624.838 50.617L621.159 54.2922C617.395 50.5281 612.195 48.2 606.451 48.2C600.708 48.2 595.508 50.5278 591.744 54.2913L588.067 50.6152L588.108 50.5736C588.263 50.4194 588.42 50.2671 588.579 50.1168C588.892 49.8199 589.213 49.5307 589.542 49.2496L589.904 48.9449L590.349 48.5849L590.747 48.2772L591.185 47.9516L591.631 47.6348L591.888 47.4581L592.605 46.9897L593.143 46.6597L593.631 46.3757L594.348 45.983L594.924 45.6886L595.509 45.4077L596.056 45.1613L596.697 44.8917L597.346 44.6389L597.922 44.4314L598.664 44.1863L599.175 44.0318L599.845 43.8469L600.506 43.6829L601.081 43.5553L601.744 43.425L602.414 43.3116L603.059 43.2193L603.729 43.1408L604.415 43.0786L605.171 43.031L605.808 43.0078Z"
                  fill="black"
                />
                <rect x={537} y="58.6" width="6.93333" height="8.66667" rx={2} fill="black" />
                <rect x="547.4" y="55.1334" width="6.93333" height="12.1333" rx={2} fill="black" />
                <rect x="557.8" y="49.9333" width="6.93333" height="17.3333" rx={2} fill="black" />
                <rect x="568.2" y="44.7333" width="6.93333" height="22.5333" rx={2} fill="black" />
                <path
                  d="M104.199 43C98.8271 43 95 46.6726 95 51.701V51.7353C95 56.4376 98.3294 59.9043 103.083 59.9043C106.481 59.9043 108.644 58.171 109.553 56.2145H109.896C109.896 56.4033 109.879 56.5921 109.879 56.7809C109.69 61.5175 108.026 65.3617 104.096 65.3617C101.916 65.3617 100.389 64.229 99.7366 62.4957L99.6851 62.3241H95.3261L95.3604 62.5129C96.1498 66.3056 99.5479 69 104.096 69C110.325 69 114.084 64.0574 114.084 55.7168V55.6825C114.084 46.7584 109.484 43 104.199 43ZM104.182 56.5063C101.367 56.5063 99.3248 54.4469 99.3248 51.5809V51.5465C99.3248 48.7835 101.504 46.604 104.233 46.604C106.979 46.604 109.124 48.8178 109.124 51.6495V51.6838C109.124 54.4812 106.979 56.5063 104.182 56.5063Z"
                  fill="black"
                />
                <path
                  d="M121.875 52.336C123.454 52.336 124.604 51.1347 124.604 49.6244C124.604 48.097 123.454 46.9129 121.875 46.9129C120.314 46.9129 119.147 48.097 119.147 49.6244C119.147 51.1347 120.314 52.336 121.875 52.336ZM121.875 65.07C123.454 65.07 124.604 63.8858 124.604 62.3584C124.604 60.831 123.454 59.6469 121.875 59.6469C120.314 59.6469 119.147 60.831 119.147 62.3584C119.147 63.8858 120.314 65.07 121.875 65.07Z"
                  fill="black"
                />
                <path
                  d="M141.68 68.3822H145.919V63.6284H149.248V59.9729H145.919V43.6178H139.655C136.291 48.732 132.773 54.4297 129.564 60.0073V63.6284H141.68V68.3822ZM133.683 60.0759V59.8185C136.085 55.6139 138.951 51.0317 141.491 47.1531H141.749V60.0759H133.683Z"
                  fill="black"
                />
                <path
                  d="M159.511 68.3822H163.939V43.6178H159.528L153.058 48.1657V52.336L159.219 47.9769H159.511V68.3822Z"
                  fill="black"
                />
                <rect x={241} y={1601} width={268} height={10} rx={5} fill="black" />
              </svg>
              {/* Imagen del dashboard móvil sobre el mockup */}
              <div className="absolute left-0 top-7 w-full h-full z-10 flex items-start justify-center overflow-hidden">
                <Image
                  src={mobileImage}
                  alt={`${alt} en móvil`}
                  fill
                  className="object-cover object-top"
                  priority={priority}
                  style={{ borderRadius: 0 }}
                />
              </div>
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
