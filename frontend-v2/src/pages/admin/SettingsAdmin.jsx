import * as Switch from '@radix-ui/react-switch';
import { useState } from 'react';
import { Field } from '../../components/shared.jsx';

export default function SettingsAdmin({ t, settings, setSettings }) {
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState(settings);

  const save = () => {
    setSettings(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  return (
    <section className="settings-grid">
      <div className="content-panel">
        <span className="section-kicker">{t('admin.settings.title')}</span>
        <h2>{t('admin.settings.copy')}</h2>
        <div className="form-grid">
          <Field label={t('admin.settings.brandName')}>
            <input value={draft.brandName} onChange={(event) => setDraft((current) => ({ ...current, brandName: event.target.value }))} />
          </Field>
          <Field label={t('admin.settings.customerTagline')}>
            <input value={draft.customerTaglineCustom || t(draft.customerTaglineKey)} onChange={(event) => setDraft((current) => ({ ...current, customerTaglineCustom: event.target.value }))} />
          </Field>
          <Field label={t('admin.settings.staffTagline')}>
            <input value={draft.staffTaglineCustom || t(draft.staffTaglineKey)} onChange={(event) => setDraft((current) => ({ ...current, staffTaglineCustom: event.target.value }))} />
          </Field>
        </div>
        <Field label={t('admin.settings.policy')}>
          <textarea rows="4" value={draft.policy || t(draft.policyKey ?? 'admin.settings.defaultPolicy')} onChange={(event) => setDraft((current) => ({ ...current, policy: event.target.value }))} />
        </Field>
      </div>

      <div className="content-panel">
        <label className="switch-row">
          <span>{t('admin.settings.publicCatalogue')}</span>
          <Switch.Root className="switch" checked={draft.publicCatalogue} onCheckedChange={(checked) => setDraft((current) => ({ ...current, publicCatalogue: checked }))}>
            <Switch.Thumb className="switch-thumb" />
          </Switch.Root>
        </label>
        <label className="switch-row">
          <span>{t('admin.settings.requireProof')}</span>
          <Switch.Root className="switch" checked={draft.requireVerifiedProof} onCheckedChange={(checked) => setDraft((current) => ({ ...current, requireVerifiedProof: checked }))}>
            <Switch.Thumb className="switch-thumb" />
          </Switch.Root>
        </label>
        <button className="primary-button" type="button" onClick={save}>
          {t('common.save')}
        </button>
        {saved ? <p className="success-message">{t('admin.settings.saved')}</p> : null}
      </div>
    </section>
  );
}
