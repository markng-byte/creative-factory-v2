import type { Metadata } from 'next';
import { parseWebEnv } from '@creative-factory/env-config';
import './globals.css';

const env = parseWebEnv(process.env);

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: 'Enterprise AI Creative Factory',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
