import '../styles/global.css';
import { Providers } from '@/app/providers';

export const metadata = {
  title: 'Costume Rental',
  description: 'Costume Rental Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
