import Link from 'next/link';

export default function Confirmado() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">¡Email confirmado!</h1>
        <p className="text-gray-700 text-center mb-6">
          Tu email ha sido confirmado exitosamente. Vuelve a la pestaña original.
        </p>
        <Link
          href="/"
          className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition"
        >
          Ver inicio de Turnate
        </Link>
      </div>
    </div>
  );
}