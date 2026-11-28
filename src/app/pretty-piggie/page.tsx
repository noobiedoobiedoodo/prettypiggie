import type { Metadata } from 'next';
import { PrettyPiggieExperience } from '@/components/pretty-piggie/PrettyPiggieExperience';

export const metadata: Metadata = {
  title: 'What Would You Look Like as a Pretty Piggie? | PrettyPiggie.com',
  description:
    'Your face. Your glam. Your Pretty Piggie. Create, customize, and share your personalized 3D Pretty Piggie character in seconds — 100% private in-browser.',
  openGraph: {
    title: 'What Would You Look Like as a Pretty Piggie?',
    description:
      'Your face. Your glam. Your Pretty Piggie. Create yours free at PrettyPiggie.com #MyPrettyPiggie',
    type: 'website',
    url: 'https://prettypiggie.com/pretty-piggie',
    siteName: 'Pretty Piggie™',
    images: [
      {
        url: '/brand/makeover-studio/master-pretty-piggie-reference.png',
        width: 1024,
        height: 1024,
        alt: 'Pretty Piggie Character Studio',
      },
    ],
  },
};

export default function PrettyPiggiePage() {
  return <PrettyPiggieExperience />;
}
