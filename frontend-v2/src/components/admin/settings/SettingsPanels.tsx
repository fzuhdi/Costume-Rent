import type { ReactNode } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Field } from '../../shared';
import { contentSource } from '../../../lib/rental-utils';
import type { HomeArticle, HomeContent, HomeTestimonial, TFunction } from '../../../types/domain';

export type HomeContentLocalizedField =
  | 'heroImageAlt'
  | 'heroKicker'
  | 'heroTitle'
  | 'heroCopy'
  | 'catalogueKicker'
  | 'catalogueTitle'
  | 'catalogueCopy'
  | 'articlesKicker'
  | 'articlesTitle'
  | 'testimonialsKicker'
  | 'testimonialsTitle'
  | 'locationAddress';

export type HomeContentValueField = 'heroImageUrl' | 'locationMapEmbed' | 'locationMapUrl';
export type HomeListUpdater = {
  (listName: 'articles', index: number, field: keyof Pick<HomeArticle, 'label' | 'title' | 'copy'>, value: string): void;
  (listName: 'testimonials', index: number, field: keyof Pick<HomeTestimonial, 'quote' | 'name'>, value: string): void;
};
export type HomeListValueUpdater = (
  listName: 'testimonials',
  index: number,
  field: keyof Pick<HomeTestimonial, 'photoUrl'>,
  value: string,
) => void;

type SettingsSectionHeaderProps = {
  kicker: string;
  title: string;
  copy?: string;
};

export function SettingsSectionHeader({ kicker, title, copy }: SettingsSectionHeaderProps) {
  return (
    <div className="settings-section-head">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

type HomeContentEditorProps = {
  t: TFunction;
  homeContent: HomeContent;
  updateHomeContent: (field: HomeContentLocalizedField, value: string) => void;
  updateHomeValue: (field: HomeContentValueField, value: string) => void;
  updateHomeList: HomeListUpdater;
  updateHomeListValue: HomeListValueUpdater;
};

export function HomeContentEditor({
  t,
  homeContent,
  updateHomeContent,
  updateHomeValue,
  updateHomeList,
  updateHomeListValue,
}: HomeContentEditorProps) {
  return (
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
            <textarea rows={2} value={contentSource(homeContent.heroImageAlt)} onChange={(event) => updateHomeContent('heroImageAlt', event.target.value)} />
          </SettingsField>
          <Field label={t('admin.settings.homeHeroKicker')}>
            <input value={contentSource(homeContent.heroKicker)} onChange={(event) => updateHomeContent('heroKicker', event.target.value)} />
          </Field>
          <SettingsField label={t('admin.settings.homeHeroTitle')} className="field-wide">
            <textarea rows={2} value={contentSource(homeContent.heroTitle)} onChange={(event) => updateHomeContent('heroTitle', event.target.value)} />
          </SettingsField>
          <SettingsField label={t('admin.settings.homeHeroCopy')} className="field-wide">
            <textarea rows={3} value={contentSource(homeContent.heroCopy)} onChange={(event) => updateHomeContent('heroCopy', event.target.value)} />
          </SettingsField>
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup title={t('admin.settings.homeCatalogueSection')} copy={t('admin.settings.homeCatalogueSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeCatalogueKicker')}>
            <input value={contentSource(homeContent.catalogueKicker)} onChange={(event) => updateHomeContent('catalogueKicker', event.target.value)} />
          </Field>
          <SettingsField label={t('admin.settings.homeCatalogueTitle')} className="field-wide">
            <textarea rows={2} value={contentSource(homeContent.catalogueTitle)} onChange={(event) => updateHomeContent('catalogueTitle', event.target.value)} />
          </SettingsField>
          <SettingsField label={t('admin.settings.homeCatalogueCopy')} className="field-wide">
            <textarea rows={3} value={contentSource(homeContent.catalogueCopy)} onChange={(event) => updateHomeContent('catalogueCopy', event.target.value)} />
          </SettingsField>
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup title={t('admin.settings.homeGuideSection')} copy={t('admin.settings.homeGuideSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <Field label={t('admin.settings.homeArticlesKicker')}>
            <input value={contentSource(homeContent.articlesKicker)} onChange={(event) => updateHomeContent('articlesKicker', event.target.value)} />
          </Field>
          <SettingsField label={t('admin.settings.homeArticlesTitle')} className="field-wide">
            <textarea rows={2} value={contentSource(homeContent.articlesTitle)} onChange={(event) => updateHomeContent('articlesTitle', event.target.value)} />
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
                  <textarea rows={2} value={contentSource(article.title)} onChange={(event) => updateHomeList('articles', index, 'title', event.target.value)} />
                </SettingsField>
                <SettingsField label={t('admin.settings.homeCopy')} className="field-wide">
                  <textarea rows={3} value={contentSource(article.copy)} onChange={(event) => updateHomeList('articles', index, 'copy', event.target.value)} />
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
            <textarea rows={2} value={contentSource(homeContent.testimonialsTitle)} onChange={(event) => updateHomeContent('testimonialsTitle', event.target.value)} />
          </SettingsField>
        </div>

        <div className="home-content-admin-list">
          {homeContent.testimonials.map((testimonial, index) => (
            <div className="home-content-admin-item" key={`testimonial-${index}`}>
              <span className="section-kicker">{t('admin.settings.homeTestimonial', { count: index + 1 })}</span>
              <div className="form-grid home-editor-grid">
                <SettingsField label={t('admin.settings.homeQuote')} className="field-wide">
                  <textarea rows={3} value={contentSource(testimonial.quote)} onChange={(event) => updateHomeList('testimonials', index, 'quote', event.target.value)} />
                </SettingsField>
                <Field label={t('admin.settings.homeName')}>
                  <input value={contentSource(testimonial.name)} onChange={(event) => updateHomeList('testimonials', index, 'name', event.target.value)} />
                </Field>
                <Field label={t('admin.settings.homeBuyerPhotoUrl')} hint={t('admin.settings.homeBuyerPhotoUrlHelp')}>
                  <input
                    type="text"
                    inputMode="url"
                    value={testimonial.photoUrl}
                    onChange={(event) => updateHomeListValue('testimonials', index, 'photoUrl', event.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </HomeEditorGroup>

      <HomeEditorGroup title={t('admin.settings.homeLocationSection')} copy={t('admin.settings.homeLocationSectionCopy')}>
        <div className="form-grid home-editor-grid">
          <SettingsField label={t('admin.settings.homeLocationMapEmbed')} className="field-wide">
            <textarea
              rows={3}
              value={homeContent.locationMapEmbed}
              onChange={(event) => updateHomeValue('locationMapEmbed', event.target.value)}
              aria-describedby="home-location-map-embed-help"
            />
            <small className="field-hint" id="home-location-map-embed-help">{t('admin.settings.homeLocationMapEmbedHelp')}</small>
          </SettingsField>
          <Field label={t('admin.settings.homeLocationMapUrl')} hint={t('admin.settings.homeLocationMapUrlHelp')}>
            <input
              type="text"
              inputMode="url"
              value={homeContent.locationMapUrl}
              onChange={(event) => updateHomeValue('locationMapUrl', event.target.value)}
            />
          </Field>
          <SettingsField label={t('admin.settings.homeLocationAddress')} className="field-wide">
            <textarea rows={3} value={contentSource(homeContent.locationAddress)} onChange={(event) => updateHomeContent('locationAddress', event.target.value)} />
          </SettingsField>
        </div>
      </HomeEditorGroup>
    </div>
  );
}

type HomeEditorGroupProps = {
  title: string;
  copy: string;
  children: ReactNode;
};

function HomeEditorGroup({ title, copy, children }: HomeEditorGroupProps) {
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

type SettingsFieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

function SettingsField({ label, className = '', children }: SettingsFieldProps) {
  return (
    <label className={`field-control ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

type SettingsToggleCardProps = {
  title: string;
  copy: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SettingsToggleCard({ title, copy, checked, onCheckedChange }: SettingsToggleCardProps) {
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
