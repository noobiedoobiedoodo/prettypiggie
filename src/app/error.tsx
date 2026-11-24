'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('PrettyPiggie storefront error boundary triggered:', error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-gradient-to-b from-[#F8D6E3] via-[#F2BFD2] to-[#E6A3BC] px-6 py-12 text-center text-piggie-950">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <img
          src="/brand/prettypiggie-logo.png"
          alt="Pretty Piggie Makeup"
          className="mx-auto h-20 w-20 rounded-full border-2 border-rosegold bg-white object-contain p-1.5 shadow-md"
        />
        <h1 className="mt-4 font-serif text-2xl font-bold text-piggie-950">
          Temporary Showroom Interruption
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-piggie-700">
          The interactive boutique encountered an unexpected browser error. You
          can retry the 3D showroom or switch directly to our fast 2D Catalog.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-piggie-950 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-piggie-800"
          >
            Reload Boutique
          </button>
          <Link
            href="/?mode=2d"
            className="rounded-full border border-piggie-200 bg-piggie-50 px-5 py-2.5 text-xs font-bold text-piggie-900 hover:bg-piggie-100"
          >
            Open 2D Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
