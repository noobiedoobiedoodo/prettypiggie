import type { Metadata } from 'next';
import { MakeoverStudio } from '@/components/makeover/MakeoverStudio';

export const metadata: Metadata = {
  title: "Pretty Piggie Makeover Studio — What's Your Pretty Piggie?",
  description:
    'Turn your selfie into your own glamorous 3D animated Pretty Piggie character, pick your makeup personality, and share it with #MyPrettyPiggie.',
};

export default function MakeoverStudioPage() {
  return <MakeoverStudio />;
}
