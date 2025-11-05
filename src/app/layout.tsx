import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppTransitions } from '@/components/AppTransitions';
import { StartupAnimation } from '@/components/StartupAnimation';

export const metadata: Metadata = {
  title: 'Dopamind – Tap. Play. Reset.',
  description: 'A microgame hub for stress relief and mental reset.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <div className="animated-gradient absolute inset-0 z-[-1]" />
        <FirebaseClientProvider>
          <StartupAnimation>
              <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <AppTransitions>
                    <main className="flex-1">{children}</main>
                  </AppTransitions>
                  <Footer />
              </div>
          </StartupAnimation>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
