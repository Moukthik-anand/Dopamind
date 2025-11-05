import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}
