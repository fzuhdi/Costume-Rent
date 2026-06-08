import { useState, type FormEvent } from 'react';
import {
  SettingsPageLayout,
} from '../../components/admin/common/AdminManagement';
import {
  HomeContentEditor,
  SettingsSectionHeader,
  SettingsToggleCard,
  type HomeContentLocalizedField,
  type HomeContentValueField,
} from '../../components/admin/settings/SettingsPanels';
import { Field } from '../../components/shared';
import { normalizeHomeContent } from '../../mockData';
import { toSourceContent } from '../../lib/rental-utils';
import type { StateSetter } from '../../types/app';
import type { DataAdapter, HomeArticle, HomeTestimonial, LocalizedContent, Settings, TFunction } from '../../types/domain';

type SettingsAdminProps = {
  t: TFunction;
  settings: Settings;
  setSettings: StateSetter<Settings>;
  dataAdapter?: DataAdapter;
};

type ArticleLocalizedField = keyof Pick<HomeArticle, 'label' | 'title' | 'copy'>;
type TestimonialLocalizedField = keyof Pick<HomeTestimonial, 'quote' | 'name'>;

export default function SettingsAdmin({ t, settings, setSettings, dataAdapter }: SettingsAdminProps) {
  const [saveMessage, setSaveMessage] = useState('');
  const [draft, setDraft] = useState<Settings>(settings);
  const homeContent = normalizeHomeContent(draft.homeContent);
  const normalizedDraft: Settings = { ...draft, homeContent };
  const hasChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(settings);

  const updateHomeContent = (field: HomeContentLocalizedField, value: string) => {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      return {
        ...current,
        homeContent: {
          ...merged,
          [field]: updateSource(merged[field] as LocalizedContent, value),
        },
      };
    });
  };

  const updateHomeValue = (field: HomeContentValueField, value: string) => {
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

  function updateHomeList(listName: 'articles', index: number, field: ArticleLocalizedField, value: string): void;
  function updateHomeList(listName: 'testimonials', index: number, field: TestimonialLocalizedField, value: string): void;
  function updateHomeList(
    listName: 'articles' | 'testimonials',
    index: number,
    field: ArticleLocalizedField | TestimonialLocalizedField,
    value: string,
  ) {
    setDraft((current) => {
      const merged = normalizeHomeContent(current.homeContent);
      if (listName === 'articles') {
        const articleField = field as ArticleLocalizedField;
        const articles = merged.articles.map((item, itemIndex) => (
          itemIndex === index ? { ...item, [articleField]: updateSource(item[articleField], value) } : item
        ));
        return {
          ...current,
          homeContent: {
            ...merged,
            articles,
          },
        };
      }

      const testimonialField = field as TestimonialLocalizedField;
      const testimonials = merged.testimonials.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [testimonialField]: updateSource(item[testimonialField], value) } : item
      ));
      return {
        ...current,
        homeContent: {
          ...merged,
          testimonials,
        },
      };
    });
  }

  const updateHomeListValue = (
    listName: 'testimonials',
    index: number,
    field: keyof Pick<HomeTestimonial, 'photoUrl'>,
    value: string,
  ) => {
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

  const saveAllSettings = async (event: FormEvent<HTMLFormElement>) => {
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
    <SettingsPageLayout className={`settings-form ${hasChanges ? 'has-pending-save' : ''}`} onSubmit={saveAllSettings}>
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
          <textarea rows={4} value={draft.policy || t(draft.policyKey ?? 'admin.settings.defaultPolicy')} onChange={(event) => setDraft((current) => ({ ...current, policy: event.target.value }))} />
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
    </SettingsPageLayout>
  );
}

function updateSource(content: LocalizedContent, source: string): LocalizedContent {
  return {
    ...toSourceContent(content),
    source,
  };
}
