import * as Switch from '@radix-ui/react-switch';
import { useState } from 'react';
import { Field } from '../../components/shared.jsx';
import { normalizeHomeContent } from '../../mockData.js';
import { contentSource, toSourceContent } from '../../lib/rental-utils.js';

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

        <div className="home-content-admin-groups">
          <HomeEditorGroup title={t('admin.settings.homeHeroSection')} copy={t('admin.settings.homeHeroSectionCopy')}>
            <div className="form-grid home-editor-grid">
              <Field label={t('admin.settings.homeHeroImageUrl')} hint={t('admin.settings.homeHeroImageHelp')}>
                <input
                  type="text"
                  inputMode="url"
                  value={homeContent.heroImageUrl}
                  onChange={(event) => updateHomeValue('heroImageUrl', event.target.value)}
                  placeholder={t('admin.settings.homeHeroImagePlaceholder')}
                />
              </Field>
              <SettingsField label={t('admin.settings.homeHeroImageAlt')} className="field-wide">
                <textarea rows="2" value={contentSource(homeContent.heroImageAlt)} onChange={(event) => updateHomeContent('heroImageAlt', event.target.value)} />
              </SettingsField>
              <Field label={t('admin.settings.homeHeroKicker')}>
                <input value={contentSource(homeContent.heroKicker)} onChange={(event) => updateHomeContent('heroKicker', event.target.value)} />
              </Field>
              <SettingsField label={t('admin.settings.homeHeroTitle')} className="field-wide">
                <textarea rows="2" value={contentSource(homeContent.heroTitle)} onChange={(event) => updateHomeContent('heroTitle', event.target.value)} />
              </SettingsField>
              <SettingsField label={t('admin.settings.homeHeroCopy')} className="field-wide">
                <textarea rows="3" value={contentSource(homeContent.heroCopy)} onChange={(event) => updateHomeContent('heroCopy', event.target.value)} />
              </SettingsField>
            </div>
          </HomeEditorGroup>

          <HomeEditorGroup title={t('admin.settings.homeCatalogueSection')} copy={t('admin.settings.homeCatalogueSectionCopy')}>
            <div className="form-grid home-editor-grid">
              <Field label={t('admin.settings.homeCatalogueKicker')}>
                <input value={contentSource(homeContent.catalogueKicker)} onChange={(event) => updateHomeContent('catalogueKicker', event.target.value)} />
              </Field>
              <SettingsField label={t('admin.settings.homeCatalogueTitle')} className="field-wide">
                <textarea rows="2" value={contentSource(homeContent.catalogueTitle)} onChange={(event) => updateHomeContent('catalogueTitle', event.target.value)} />
              </SettingsField>
              <SettingsField label={t('admin.settings.homeCatalogueCopy')} className="field-wide">
                <textarea rows="3" value={contentSource(homeContent.catalogueCopy)} onChange={(event) => updateHomeContent('catalogueCopy', event.target.value)} />
              </SettingsField>
            </div>
          </HomeEditorGroup>

          <HomeEditorGroup title={t('admin.settings.homeGuideSection')} copy={t('admin.settings.homeGuideSectionCopy')}>
            <div className="form-grid home-editor-grid">
              <Field label={t('admin.settings.homeArticlesKicker')}>
                <input value={contentSource(homeContent.articlesKicker)} onChange={(event) => updateHomeContent('articlesKicker', event.target.value)} />
              </Field>
              <SettingsField label={t('admin.settings.homeArticlesTitle')} className="field-wide">
                <textarea rows="2" value={contentSource(homeContent.articlesTitle)} onChange={(event) => updateHomeContent('articlesTitle', event.target.value)} />
              </SettingsField>
            </div>

            <div className="home-content-admin-list">
              {homeContent.articles.map((article, index) => (
                <div className="home-content-admin-item" key={`article-${index}`}>
                  <span className="section-kicker">{t('admin.settings.homeArticle', { count: index + 1 })}</span>
                  <div className="form-grid home-editor-grid">
                    <Field label={t('admin.settings.homeLabel')}>
                      <input value={contentSource(article.label)} onChange={(event) => updateHomeList('articles', index, 'label', event.target.value)} />
                    </Field>
                    <SettingsField label={t('admin.settings.homeTitle')} className="field-wide">
                      <textarea rows="2" value={contentSource(article.title)} onChange={(event) => updateHomeList('articles', index, 'title', event.target.value)} />
                    </SettingsField>
                    <SettingsField label={t('admin.settings.homeCopy')} className="field-wide">
                      <textarea rows="3" value={contentSource(article.copy)} onChange={(event) => updateHomeList('articles', index, 'copy', event.target.value)} />
                    </SettingsField>
                  </div>
                </div>
              ))}
            </div>
          </HomeEditorGroup>

          <HomeEditorGroup title={t('admin.settings.homeTestimonialsSection')} copy={t('admin.settings.homeTestimonialsSectionCopy')}>
            <div className="form-grid home-editor-grid">
              <Field label={t('admin.settings.homeTestimonialsKicker')}>
                <input value={contentSource(homeContent.testimonialsKicker)} onChange={(event) => updateHomeContent('testimonialsKicker', event.target.value)} />
              </Field>
              <SettingsField label={t('admin.settings.homeTestimonialsTitle')} className="field-wide">
                <textarea rows="2" value={contentSource(homeContent.testimonialsTitle)} onChange={(event) => updateHomeContent('testimonialsTitle', event.target.value)} />
              </SettingsField>
            </div>

            <div className="home-content-admin-list">
              {homeContent.testimonials.map((testimonial, index) => (
                <div className="home-content-admin-item" key={`testimonial-${index}`}>
                  <span className="section-kicker">{t('admin.settings.homeTestimonial', { count: index + 1 })}</span>
                  <div className="form-grid home-editor-grid">
                    <SettingsField label={t('admin.settings.homeQuote')} className="field-wide">
                      <textarea rows="3" value={contentSource(testimonial.quote)} onChange={(event) => updateHomeList('testimonials', index, 'quote', event.target.value)} />
                    </SettingsField>
                    <Field label={t('admin.settings.homeName')}>
                      <input value={contentSource(testimonial.name)} onChange={(event) => updateHomeList('testimonials', index, 'name', event.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </HomeEditorGroup>
        </div>
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

function SettingsSectionHeader({ kicker, title, copy }) {
  return (
    <div className="settings-section-head">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

function HomeEditorGroup({ title, copy, children }) {
  return (
    <section className="home-content-admin-group">
      <div className="home-content-admin-group-head">
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      {children}
    </section>
  );
}

function SettingsField({ label, className = '', children }) {
  return (
    <label className={`field-control ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SettingsToggleCard({ title, copy, checked, onCheckedChange }) {
  return (
    <label className="settings-toggle-card">
      <span>
        <strong>{title}</strong>
        <small>{copy}</small>
      </span>
      <Switch.Root className="switch" checked={checked} onCheckedChange={onCheckedChange} aria-label={title}>
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </label>
  );
}

function updateSource(content, source) {
  return {
    ...toSourceContent(content),
    source,
  };
}
