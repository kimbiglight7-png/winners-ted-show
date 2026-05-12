import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '위너스 TED쇼',
  description: '발표자와 청중이 함께 만드는 TED쇼 설문 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
