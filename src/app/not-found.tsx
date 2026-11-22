import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-gradient-to-b from-[#F8D6E3] via-[#F2BFD2] to-[#E6A3BC] px-6 py-12 text-center text-piggie-950">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <img
          src="/brand/prettypiggie-logo.png"
          alt="Pretty Piggie Makeup"
          className="mx-auto h-20 w-20 rounded-full border-2 border-rosegold bg-white object-contain p-1.5 shadow-md"
        />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-piggie-600">
          404 • Boutique Room Not Found
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-piggie-950">
          Return to Pretty Piggie Makeup
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-piggie-700">
          The page you requested does not exist. Explore our 3D virtual showroom
          or browse the full 2D catalog.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-piggie-950 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-piggie-800"
          >
            Enter 3D Showroom
          </Link>
          <Link
            href="/?mode=2d"
            className="rounded-full border border-piggie-200 bg-piggie-50 px-5 py-2.5 text-xs font-bold text-piggie-900 hover:bg-piggie-100"
          >
            Browse 2D Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
