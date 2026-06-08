import { useState } from 'react';
import { HomeContentEditor, SettingsSectionHeader, SettingsToggleCard } from '../../components/admin/settings/SettingsPanels.jsx';
import { Field } from '../../components/shared.jsx';
import { normalizeHomeContent } from '../../mockData.js';
import { toSourceContent } from '../../lib/rental-utils.js';

export default function SettingsAdmin({ t, settings, setSettings, dataAdapter }) {
  const [saveMessage, setSaveMessage] = useState('');
  const [draft, setDraft] = useState(settings);
  const homeContent = normalizeHomeContent(draft.homeContent);
  const normalizedDraft = { ...draft, homeContent };
  const hasChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(settings);

  const updateHomeContent = (field, value) => {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      return {
        ...current,
        homeContent: {
          ...merged,
          [field]: updateSource(merged[field], value),
        },
      };
    });
  };

  const updateHomeValue = (field, value) => {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      return {
        ...current,
        homeContent: {
          ...merged,
          [field]: value,
        },
      };
    });
  };

  const updateHomeList = (listName, index, field, value) => {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      const nextList = merged[listName].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: updateSource(item[field], value) } : item
      ));
      return {
        ...current,
        homeContent: {
          ...merged,
          [listName]: nextList,
        },
      };
    });
  };

  const updateHomeListValue = (listName, index, field, value) => {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      const nextList = merged[listName].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ));
      return {
        ...current,
        homeContent: {
          ...merged,
          [listName]: nextList,
        },
      };
    });
  };

  const saveAllSettings = async (event) => {
    event.preventDefault();
    if (!hasChanges) return;

    if (dataAdapter) {
      await dataAdapter.admin.settings.save(normalizedDraft);
    } else {
      setSettings(normalizedDraft);
    }
    setDraft(normalizedDraft);
    setSaveMessage(t('admin.settings.saved'));
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  return (
    <form className={`settings-grid settings-form ${hasChanges ? 'has-pending-save' : ''}`} onSubmit={saveAllSettings}>
      <section className="content-panel setting-section">
        <SettingsSectionHeader
          kicker={t('admin.settings.title')}
          title={t('admin.settings.brandName')}
          copy={t('admin.settings.copy')}
        />
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
      </section>

      <section className="content-panel setting-section">
        <SettingsSectionHeader kicker={t('admin.settings.policy')} title={t('admin.settings.policy')} />
        <Field label={t('admin.settings.policy')}>
          <textarea rows="4" value={draft.policy || t(draft.policyKey ?? 'admin.settings.defaultPolicy')} onChange={(event) => setDraft((current) => ({ ...current, policy: event.target.value }))} />
        </Field>
      </section>

      <section className="content-panel setting-section home-content-editor">
        <SettingsSectionHeader
          kicker={t('admin.settings.homeContent')}
          title={t('admin.settings.homeContent')}
          copy={t('admin.settings.homeContentCopy')}
        />

        <HomeContentEditor
          t={t}
          homeContent={homeContent}
          updateHomeContent={updateHomeContent}
          updateHomeValue={updateHomeValue}
          updateHomeList={updateHomeList}
          updateHomeListValue={updateHomeListValue}
        />
      </section>

      <section className="settings-toggle-grid">
        <SettingsToggleCard
          title={t('admin.settings.publicCatalogue')}
          copy={t('admin.settings.publicCatalogueCopy')}
          checked={draft.publicCatalogue}
          onCheckedChange={(checked) => setDraft((current) => ({ ...current, publicCatalogue: checked }))}
        />
        <SettingsToggleCard
          title={t('admin.settings.requireProof')}
          copy={t('admin.settings.requireProofCopy')}
          checked={draft.requireVerifiedProof}
          onCheckedChange={(checked) => setDraft((current) => ({ ...current, requireVerifiedProof: checked }))}
        />
      </section>

      <div className={`settings-savebar ${hasChanges ? 'is-active' : 'is-idle'}`} role="status" aria-live="polite">
        <span className={`settings-savebar-status ${saveMessage ? 'saved' : ''}`}>
          {saveMessage || (hasChanges ? t('admin.catalogue.unsaved') : t('admin.catalogue.noChanges'))}
        </span>
        {hasChanges ? (
          <button className="primary-button" type="submit">
            {t('admin.settings.saveAll')}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function updateSource(content, source) {
  return {
    ...toSourceContent(content),
    source,
  };
}
