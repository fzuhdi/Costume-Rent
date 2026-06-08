import { CheckCircle2, Loader2, RotateCcw, Save, XCircle } from 'lucide-react';
import { StickyActionBar } from '../../shared';
import type { SaveState } from './catalogueAdminUtils';
import type { TFunction } from '../../../types/domain';

export function EditorSaveBar({
  t,
  isDirty,
  hasValidationErrors,
  saveState,
  onSave,
  onDiscard,
}: {
  t: TFunction;
  isDirty: boolean;
  hasValidationErrors: boolean;
  saveState: SaveState;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
}) {
  const saving = saveState.status === 'saving';
  return (
    <StickyActionBar className="catalogue-savebar" role="status" aria-live="polite">
      <div className="savebar-state">
        {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : saveState.status === 'error' ? <XCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
        <span>{hasValidationErrors ? t('admin.catalogue.fixValidation') : saveState.message || (isDirty ? t('admin.catalogue.unsaved') : t('admin.catalogue.noChanges'))}</span>
      </div>
      <div className="savebar-actions">
        <button className="outline-button" type="button" onClick={onDiscard} disabled={!isDirty || saving}>
          <RotateCcw aria-hidden="true" />
          {t('admin.catalogue.discardChanges')}
        </button>
        <button className="primary-button" type="button" onClick={onSave} disabled={!isDirty || saving || hasValidationErrors}>
          {saving ? <Loader2 aria-hidden="true" className="spin-icon" /> : <Save aria-hidden="true" />}
          {saving ? t('admin.catalogue.saving') : t('admin.catalogue.saveChanges')}
        </button>
      </div>
    </StickyActionBar>
  );
}
