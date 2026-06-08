import { AlertTriangle, XCircle } from 'lucide-react';
import { defaultDates } from '../../../mockData.js';
import { getVariantAvailability } from '../../../lib/rental-utils.js';

export function CatalogueStockFraction({ product, t }) {
  const total = product.variants.reduce((sum, variant) => sum + (Number(variant.total) || 0), 0);
  const available = product.active
    ? product.variants.reduce((sum, variant) => sum + getVariantAvailability(product, variant.id, defaultDates), 0)
    : 0;
  if (total > 0 && available / total > 0.3) return null;

  const tone = available <= 0 ? 'danger' : 'warning';
  const Icon = available <= 0 ? XCircle : AlertTriangle;

  return (
    <span className={`status-badge ${tone} catalogue-stock-fraction`}>
      <Icon aria-hidden="true" />
      <span className="status-badge-label">{t('admin.catalogue.stockFraction', { available, total })}</span>
    </span>
  );
}
