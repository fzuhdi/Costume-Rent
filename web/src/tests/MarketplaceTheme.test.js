import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const marketplaceCss = readFileSync(
  resolve(process.cwd(), 'src/styles/marketplace.css'),
  'utf8',
).toLowerCase();
const adminCss = readFileSync(
  resolve(process.cwd(), 'src/styles/global.css'),
  'utf8',
).toLowerCase();
const realSeal = readFileSync(
  resolve(process.cwd(), 'public/brand/bu-risna-seal.webp'),
);
const monochromeMark = readFileSync(
  resolve(process.cwd(), 'public/brand/kbr-marketplace-mark-mono.svg'),
  'utf8',
);

const marketplaceModules = import.meta.glob(
  ['../app/(marketplace)/**/*.jsx', '../marketplace/**/*.jsx'],
  { eager: true, import: 'default', query: '?raw' },
);
const adminModules = import.meta.glob(
  [
    '../app/admin/**/*.jsx',
    '../app/login/**/*.jsx',
    '../components/**/*.jsx',
    '!../components/ui/**/*.jsx',
  ],
  { eager: true, import: 'default', query: '?raw' },
);
const marketplaceSource = Object.values(marketplaceModules).join('\n');
const adminSource = Object.values(adminModules).join('\n');

function luminance(hex) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    .map(channel => Number.parseInt(channel, 16) / 255)
    .map(channel => (
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    ));

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));

  return (lighter + 0.05) / (darker + 0.05);
}

describe('marketplace modern-heritage theme contract', () => {
  it('defines the approved light and dark brand tokens inside the marketplace scope', () => {
    expect(marketplaceCss).toContain('.marketplace-theme {');
    expect(marketplaceCss).toContain('--mk-canvas: #f8f4ec');
    expect(marketplaceCss).toContain('--mk-primary: #8f1028');
    expect(marketplaceCss).toContain('--mk-gold: #d9a441');
    expect(marketplaceCss).toContain('--mk-media-placeholder: #eae0d4');
    expect(marketplaceCss).toContain('--mk-canvas: #17100f');
    expect(marketplaceCss).toContain('--mk-primary: #e06a78');
    expect(marketplaceCss).toContain('--mk-gold: #e0b15a');
    expect(marketplaceCss).toContain('--mk-media-placeholder: #352723');
  });

  it('maps shadcn semantics to brand tokens without treating gold as accent or status', () => {
    expect(marketplaceCss).toContain('--primary: var(--mk-primary)');
    expect(marketplaceCss).toContain('--primary-foreground: var(--mk-on-primary)');
    expect(marketplaceCss).toContain('--accent: var(--mk-primary-soft)');
    expect(marketplaceCss).toContain('--ring: var(--mk-focus)');
    expect(marketplaceCss).not.toContain('--accent: var(--mk-gold)');
    expect(marketplaceCss).not.toContain('--mk-warning: var(--mk-gold)');
    expect(marketplaceCss).toContain('--mk-success: #15803d');
    expect(marketplaceCss).toContain('--mk-warning: #a15c07');
    expect(marketplaceCss).toContain('--mk-danger: #b42318');
    expect(marketplaceCss).toContain('--mk-info: #075e8c');
  });

  it('keeps primary foreground pairs above WCAG AA contrast', () => {
    expect(contrastRatio('#8f1028', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#e06a78', '#241013')).toBeGreaterThanOrEqual(4.5);
  });

  it('anchors the separate admin palette to its existing indigo contract', () => {
    expect(adminCss).toContain('--primary: #4f46e5');
    expect(adminCss).toContain('--background: #f9fafb');
    expect(adminCss).toContain('--primary: #818cf8');
    expect(adminCss).toContain('--background: #111827');
  });

  it('keeps marketplace surfaces on shared media and elevation tokens', () => {
    expect(marketplaceSource).not.toMatch(/bg-\[#e[0-9a-f]{5}\]/i);
    expect(marketplaceSource).not.toContain('rgb(16_24_40');
    expect(marketplaceSource).toContain('bg-[var(--mk-media-placeholder)]');
    expect(marketplaceSource).toContain('shadow-[var(--mk-shadow-float)]');
  });

  it('keeps marketplace and admin component-library imports separated', () => {
    expect(marketplaceSource).not.toContain('@heroui/');
    expect(adminSource).not.toContain('@/components/ui/');
  });

  it('ships the real seal as optimized WebP with a scalable monochrome fallback', () => {
    expect(realSeal.subarray(0, 4).toString()).toBe('RIFF');
    expect(realSeal.subarray(8, 12).toString()).toBe('WEBP');
    expect(realSeal.byteLength).toBeLessThan(50_000);
    expect(monochromeMark).toContain('viewBox="0 0 40 40"');
    expect(monochromeMark).not.toMatch(/<(?:linearGradient|radialGradient|filter)\b/);
  });
});
