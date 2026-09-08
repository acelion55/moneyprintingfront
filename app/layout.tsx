import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MoneyHiest — Enterprise Multi-Tenant AI Automation Suite',
  description: 'Deploy WhatsApp AI agents, automated IVR calling, and smart AI calling workflows in a unified tenant panel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-purple-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
