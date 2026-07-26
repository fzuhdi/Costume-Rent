import '../styles/global.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { MARKETPLACE_ASSETS, MARKETPLACE_BRAND } from '@/marketplace/brand';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const themeInitializationScript = `
  (() => {
    const root = document.documentElement;
    const storageKey = 'heroui-theme';
    let savedTheme = '';

    try {
      savedTheme = localStorage.getItem(storageKey) || '';
    } catch {}

    if (!savedTheme) {
      const cookieMatch = document.cookie.match(/(?:^|;)\\s*heroui-theme=([^;]*)/);
      savedTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
    }

    const theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.dataset.theme = theme;

    if (!savedTheme) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch {}
      document.cookie = \`heroui-theme=\${theme}; path=/; SameSite=Lax\`;
    }
  })();
`;

export const metadata = {
  title: {
    default: MARKETPLACE_BRAND.name,
    template: `%s | ${MARKETPLACE_BRAND.name}`,
  },
  description: `${MARKETPLACE_BRAND.descriptor}: sewa kostum tari Indonesia dengan tanggal dan harga yang jelas.`,
  icons: {
    icon: MARKETPLACE_ASSETS.fullSealPrint,
    shortcut: MARKETPLACE_ASSETS.fullSealPrint,
    apple: MARKETPLACE_ASSETS.fullSealPrint,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={cn("font-sans", geist.variable, "light")}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
