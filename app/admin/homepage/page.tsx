import {
  Compass,
  Globe2,
  LayoutTemplate,
  Megaphone,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

import {
  createHomeHeroSlideAction,
  createHomeTrustItemAction,
  createSiteLinkAction,
  createSiteSocialLinkAction,
  deleteHomeHeroSlideAction,
  deleteHomeTrustItemAction,
  deleteSiteLinkAction,
  deleteSiteSocialLinkAction,
  updateHomeHeroSlideAction,
  updateHomeTrustItemAction,
  updateSiteLinkAction,
  updateSiteSocialLinkAction,
  updateStorefrontSettingsAction,
} from "@/app/admin/actions";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import HomepageProductSectionsAdminList from "@/components/admin/homepage/HomepageProductSectionsAdminList";
import {
  AdminPageHero,
  EmptyState,
  Field,
  MetricCard,
  SectionHeading,
  StatusPill,
  adminSurfaceClassName,
} from "@/components/admin/AdminPagePrimitives";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import ImageDropInput from "@/components/admin/ImageDropInput";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminHomepageProductSectionsData,
  type AdminHomepageProductSectionsData,
} from "@/lib/admin-homepage-product-sections";
import { getAdminHomepagePageData } from "@/lib/admin-pages";
import { resolveImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const getQueryValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const linkGroups = [
  { value: "header", label: "Header" },
  { value: "footer_quick", label: "Footer rapide" },
  { value: "footer_legal", label: "Footer legal" },
] as const;

const trustIconSuggestions = ["truck", "shield", "headset", "wallet", "return"];

const fallbackHomepageProductSectionsData: AdminHomepageProductSectionsData = {
  isSchemaReady: false,
  products: [],
  sections: [],
};

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [resolvedSearchParams, data] = await Promise.all([searchParams, getAdminHomepagePageData()]);
  let homepageProductSectionsData = fallbackHomepageProductSectionsData;

  try {
    homepageProductSectionsData = await getAdminHomepageProductSectionsData();
  } catch (error) {
    console.error("Failed to load admin homepage product sections data.", error);
  }

  const statusMessage = getQueryValue(resolvedSearchParams, "status");
  const errorMessage = getQueryValue(resolvedSearchParams, "error");

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHero
        badge="Homepage dynamique"
        title="Pilotez chaque section de l'accueil depuis le back-office."
        description="Annonce, hero slider, blocs confiance, liens navigation/footer et contenu newsletter: toute la homepage peut etre geree sans toucher au code."
        aside={
          <div className="space-y-3">
            <div className="rounded-2xl bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Slides hero</p>
              <p className="mt-2 text-3xl font-semibold">{data.metrics.heroSlides}</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Blocs confiance</p>
              <p className="mt-2 text-3xl font-semibold">{data.metrics.trustItems}</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Abonnes newsletter</p>
              <p className="mt-2 text-3xl font-semibold">{data.metrics.newsletterSubscribers}</p>
            </div>
          </div>
        }
      />

      {statusMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <HomepageProductSectionsAdminList data={homepageProductSectionsData} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={LayoutTemplate}
          label="Slides hero"
          value={new Intl.NumberFormat("fr-MA").format(data.metrics.heroSlides)}
          helper="Nombre de banniere(s) disponibles dans le carousel."
          tone="bg-cyan-50 text-cyan-700 ring-cyan-200"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Blocs confiance"
          value={new Intl.NumberFormat("fr-MA").format(data.metrics.trustItems)}
          helper="Arguments de reassurance visibles sur la homepage."
          tone="bg-emerald-50 text-emerald-700 ring-emerald-200"
        />
        <MetricCard
          icon={Compass}
          label="Liens storefront"
          value={new Intl.NumberFormat("fr-MA").format(
            data.metrics.headerLinks + data.metrics.footerLinks
          )}
          helper="Liens de navigation header et footer configures."
          tone="bg-violet-50 text-violet-700 ring-violet-200"
        />
      </section>

      <section id="general-settings" className={cn(adminSurfaceClassName, "p-6")}>
        <SectionHeading
          badge="Reglages"
          title="Contenu global homepage"
          description="Mettez a jour les titres, textes, limites de listing, newsletter et footer sans contenu hardcode."
        />

        <form action={updateStorefrontSettingsAction} className="mt-6 space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Texte annonce" htmlFor="announcement-text">
              <Input
                id="announcement-text"
                name="announcementText"
                defaultValue={data.settings.announcementText}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Lien annonce (optionnel)" htmlFor="announcement-href">
              <Input
                id="announcement-href"
                name="announcementHref"
                defaultValue={data.settings.announcementHref || ""}
                placeholder="/shop"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
          </div>

          <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="announcementEnabled"
              defaultChecked={data.settings.announcementEnabled}
              className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
            />
            Afficher la barre d&apos;annonce
          </label>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Autoplay hero (ms)" htmlFor="hero-autoplay">
              <Input
                id="hero-autoplay"
                name="heroAutoplayMs"
                type="number"
                min={2000}
                max={15000}
                defaultValue={data.settings.heroAutoplayMs}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Image loyalty (URL optionnelle)" htmlFor="loyalty-image-url">
              <Input
                id="loyalty-image-url"
                name="loyaltyImageUrl"
                defaultValue={data.settings.loyaltyImageUrl || ""}
                placeholder="/carte-fideliteEEEEE.png"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">Titres de sections</p>
              <Field label="Categories" htmlFor="featured-categories-title">
                <Input
                  id="featured-categories-title"
                  name="featuredCategoriesTitle"
                  defaultValue={data.settings.featuredCategoriesTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre categories" htmlFor="featured-categories-subtitle">
                <Textarea
                  id="featured-categories-subtitle"
                  name="featuredCategoriesSubtitle"
                  defaultValue={data.settings.featuredCategoriesSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Promotions" htmlFor="promotions-title">
                <Input
                  id="promotions-title"
                  name="promotionsTitle"
                  defaultValue={data.settings.promotionsTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre promotions" htmlFor="promotions-subtitle">
                <Textarea
                  id="promotions-subtitle"
                  name="promotionsSubtitle"
                  defaultValue={data.settings.promotionsSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Best sellers" htmlFor="best-sellers-title">
                <Input
                  id="best-sellers-title"
                  name="bestSellersTitle"
                  defaultValue={data.settings.bestSellersTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre best sellers" htmlFor="best-sellers-subtitle">
                <Textarea
                  id="best-sellers-subtitle"
                  name="bestSellersSubtitle"
                  defaultValue={data.settings.bestSellersSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Nouveautes" htmlFor="new-arrivals-title">
                <Input
                  id="new-arrivals-title"
                  name="newArrivalsTitle"
                  defaultValue={data.settings.newArrivalsTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre nouveautes" htmlFor="new-arrivals-subtitle">
                <Textarea
                  id="new-arrivals-subtitle"
                  name="newArrivalsSubtitle"
                  defaultValue={data.settings.newArrivalsSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Marques" htmlFor="brands-title">
                <Input
                  id="brands-title"
                  name="brandsTitle"
                  defaultValue={data.settings.brandsTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre marques" htmlFor="brands-subtitle">
                <Textarea
                  id="brands-subtitle"
                  name="brandsSubtitle"
                  defaultValue={data.settings.brandsSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
            </div>

            <div className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">Trust, loyalty, newsletter, footer</p>
              <Field label="Titre trust" htmlFor="trust-title">
                <Input
                  id="trust-title"
                  name="trustTitle"
                  defaultValue={data.settings.trustTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Sous-titre trust" htmlFor="trust-subtitle">
                <Textarea
                  id="trust-subtitle"
                  name="trustSubtitle"
                  defaultValue={data.settings.trustSubtitle}
                  className="min-h-20 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Badge loyalty" htmlFor="loyalty-badge">
                <Input
                  id="loyalty-badge"
                  name="loyaltyBadge"
                  defaultValue={data.settings.loyaltyBadge}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Titre loyalty" htmlFor="loyalty-title">
                <Input
                  id="loyalty-title"
                  name="loyaltyTitle"
                  defaultValue={data.settings.loyaltyTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Description loyalty" htmlFor="loyalty-description">
                <Textarea
                  id="loyalty-description"
                  name="loyaltyDescription"
                  defaultValue={data.settings.loyaltyDescription}
                  className="min-h-24 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="CTA loyalty" htmlFor="loyalty-cta-label">
                  <Input
                    id="loyalty-cta-label"
                    name="loyaltyCtaLabel"
                    defaultValue={data.settings.loyaltyCtaLabel}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
                <Field label="Lien CTA loyalty" htmlFor="loyalty-cta-href">
                  <Input
                    id="loyalty-cta-href"
                    name="loyaltyCtaHref"
                    defaultValue={data.settings.loyaltyCtaHref}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
              </div>
              <Field label="Highlight loyalty" htmlFor="loyalty-highlight-text">
                <Input
                  id="loyalty-highlight-text"
                  name="loyaltyHighlightText"
                  defaultValue={data.settings.loyaltyHighlightText}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Titre newsletter" htmlFor="newsletter-title">
                <Input
                  id="newsletter-title"
                  name="newsletterTitle"
                  defaultValue={data.settings.newsletterTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Description newsletter" htmlFor="newsletter-description">
                <Textarea
                  id="newsletter-description"
                  name="newsletterDescription"
                  defaultValue={data.settings.newsletterDescription}
                  className="min-h-24 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Placeholder newsletter" htmlFor="newsletter-placeholder">
                  <Input
                    id="newsletter-placeholder"
                    name="newsletterPlaceholder"
                    defaultValue={data.settings.newsletterPlaceholder}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
                <Field label="Bouton newsletter" htmlFor="newsletter-button-label">
                  <Input
                    id="newsletter-button-label"
                    name="newsletterButtonLabel"
                    defaultValue={data.settings.newsletterButtonLabel}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
              </div>
              <Field label="Message succes newsletter" htmlFor="newsletter-success-message">
                <Input
                  id="newsletter-success-message"
                  name="newsletterSuccessMessage"
                  defaultValue={data.settings.newsletterSuccessMessage}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Message erreur newsletter" htmlFor="newsletter-error-message">
                <Input
                  id="newsletter-error-message"
                  name="newsletterErrorMessage"
                  defaultValue={data.settings.newsletterErrorMessage}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Titre bloc a propos footer" htmlFor="footer-about-title">
                <Input
                  id="footer-about-title"
                  name="footerAboutTitle"
                  defaultValue={data.settings.footerAboutTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Description bloc a propos footer" htmlFor="footer-about-description">
                <Textarea
                  id="footer-about-description"
                  name="footerAboutDescription"
                  defaultValue={data.settings.footerAboutDescription}
                  className="min-h-24 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Titre footer liens rapides" htmlFor="footer-quick-links-title">
                  <Input
                    id="footer-quick-links-title"
                    name="footerQuickLinksTitle"
                    defaultValue={data.settings.footerQuickLinksTitle}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
                <Field label="Titre footer legal" htmlFor="footer-legal-links-title">
                  <Input
                    id="footer-legal-links-title"
                    name="footerLegalLinksTitle"
                    defaultValue={data.settings.footerLegalLinksTitle}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
              </div>
              <Field label="Titre footer categories" htmlFor="footer-categories-title">
                <Input
                  id="footer-categories-title"
                  name="footerCategoriesTitle"
                  defaultValue={data.settings.footerCategoriesTitle}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Telephone footer" htmlFor="footer-contact-phone">
                  <Input
                    id="footer-contact-phone"
                    name="footerContactPhone"
                    defaultValue={data.settings.footerContactPhone || ""}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
                <Field label="Email footer" htmlFor="footer-contact-email">
                  <Input
                    id="footer-contact-email"
                    name="footerContactEmail"
                    defaultValue={data.settings.footerContactEmail || ""}
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                  />
                </Field>
              </div>
              <Field label="Horaires footer" htmlFor="footer-contact-hours">
                <Input
                  id="footer-contact-hours"
                  name="footerContactHours"
                  defaultValue={data.settings.footerContactHours || ""}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
              <Field label="Copyright footer" htmlFor="footer-copyright-text">
                <Input
                  id="footer-copyright-text"
                  name="footerCopyrightText"
                  defaultValue={data.settings.footerCopyrightText}
                  className="h-11 rounded-2xl border-slate-200 bg-white"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Limite categories" htmlFor="featured-categories-limit">
              <Input
                id="featured-categories-limit"
                name="featuredCategoriesLimit"
                type="number"
                min={1}
                max={16}
                defaultValue={data.settings.featuredCategoriesLimit}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Limite promotions" htmlFor="promotions-limit">
              <Input
                id="promotions-limit"
                name="promotionsLimit"
                type="number"
                min={1}
                max={24}
                defaultValue={data.settings.promotionsLimit}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Limite best sellers" htmlFor="best-sellers-limit">
              <Input
                id="best-sellers-limit"
                name="bestSellersLimit"
                type="number"
                min={1}
                max={24}
                defaultValue={data.settings.bestSellersLimit}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Limite nouveautes" htmlFor="new-arrivals-limit">
              <Input
                id="new-arrivals-limit"
                name="newArrivalsLimit"
                type="number"
                min={1}
                max={24}
                defaultValue={data.settings.newArrivalsLimit}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Limite marques" htmlFor="brands-limit">
              <Input
                id="brands-limit"
                name="brandsLimit"
                type="number"
                min={1}
                max={18}
                defaultValue={data.settings.brandsLimit}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
          </div>

          <AdminSubmitButton
            pendingLabel="Enregistrement..."
            className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
          >
            Enregistrer les reglages homepage
          </AdminSubmitButton>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
            Nouveau slide
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Ajouter un slide hero
          </h2>
          <form action={createHomeHeroSlideAction} className="mt-6 space-y-5">
            <Field label="Titre" htmlFor="hero-title">
              <Input
                id="hero-title"
                name="title"
                placeholder="Titre principal"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Badge" htmlFor="hero-badge">
              <Input
                id="hero-badge"
                name="badge"
                placeholder="Ex: Promotions actives"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Sous-titre" htmlFor="hero-subtitle">
              <Textarea
                id="hero-subtitle"
                name="subtitle"
                className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Label CTA" htmlFor="hero-cta-label">
                <Input
                  id="hero-cta-label"
                  name="ctaLabel"
                  placeholder="Explorer"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>
              <Field label="Lien CTA" htmlFor="hero-cta-href">
                <Input
                  id="hero-cta-href"
                  name="ctaHref"
                  placeholder="/shop"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>
            </div>
            <Field label="Image URL optionnelle" htmlFor="hero-image-url">
              <Input
                id="hero-image-url"
                name="imageUrl"
                placeholder="/static-assets/homepage/..."
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <ImageDropInput
              id="hero-image-file"
              name="imageFile"
              label="Image hero"
              helper="Upload direct vers static-assets/homepage."
            />
            <Field label="Alt image" htmlFor="hero-alt-text">
              <Input
                id="hero-alt-text"
                name="altText"
                placeholder="Description visuelle"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Ordre" htmlFor="hero-sort-order">
              <Input
                id="hero-sort-order"
                name="sortOrder"
                type="number"
                min={0}
                max={200}
                defaultValue={0}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
              />
              Slide actif
            </label>

            <AdminSubmitButton
              pendingLabel="Ajout..."
              className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
            >
              Ajouter le slide
            </AdminSubmitButton>
          </form>
        </div>

        <div className={cn(adminSurfaceClassName, "p-6")}>
          <SectionHeading
            badge="Hero"
            title="Slides existants"
            description="Modifiez le contenu du slider principal de la homepage."
          />
          <div className="mt-6 space-y-4">
            {data.heroSlides.length ? (
              data.heroSlides.map((slide) => (
                <div
                  key={slide.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-slate-950">{slide.title}</h4>
                        <StatusPill
                          value={slide.isActive ? "active" : "inactive"}
                          label={slide.isActive ? "Actif" : "Inactif"}
                        />
                      </div>
                      {slide.badge ? <p className="text-sm text-slate-500">{slide.badge}</p> : null}
                      <p className="text-xs text-slate-500">Ordre: {slide.sortOrder}</p>
                    </div>
                    <form action={deleteHomeHeroSlideAction}>
                      <input type="hidden" name="id" value={slide.id} />
                      <AdminDeleteButton confirmMessage={`Supprimer le slide "${slide.title}" ?`} />
                    </form>
                  </div>

                  <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      Modifier ce slide
                    </summary>
                    <div className="border-t border-slate-200 p-5">
                      <form action={updateHomeHeroSlideAction} className="space-y-5">
                        <input type="hidden" name="id" value={slide.id} />
                        <Field label="Titre" htmlFor={`hero-title-${slide.id}`}>
                          <Input
                            id={`hero-title-${slide.id}`}
                            name="title"
                            defaultValue={slide.title}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Badge" htmlFor={`hero-badge-${slide.id}`}>
                          <Input
                            id={`hero-badge-${slide.id}`}
                            name="badge"
                            defaultValue={slide.badge || ""}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Sous-titre" htmlFor={`hero-subtitle-${slide.id}`}>
                          <Textarea
                            id={`hero-subtitle-${slide.id}`}
                            name="subtitle"
                            defaultValue={slide.subtitle || ""}
                            className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <div className="grid gap-5 md:grid-cols-2">
                          <Field label="Label CTA" htmlFor={`hero-cta-label-${slide.id}`}>
                            <Input
                              id={`hero-cta-label-${slide.id}`}
                              name="ctaLabel"
                              defaultValue={slide.ctaLabel || ""}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>
                          <Field label="Lien CTA" htmlFor={`hero-cta-href-${slide.id}`}>
                            <Input
                              id={`hero-cta-href-${slide.id}`}
                              name="ctaHref"
                              defaultValue={slide.ctaHref || ""}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>
                        </div>
                        <Field label="Image URL optionnelle" htmlFor={`hero-image-url-${slide.id}`}>
                          <Input
                            id={`hero-image-url-${slide.id}`}
                            name="imageUrl"
                            defaultValue={slide.imageUrl || ""}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <ImageDropInput
                          id={`hero-image-file-${slide.id}`}
                          name="imageFile"
                          label="Changer l'image"
                          existingImageUrls={
                            slide.imageUrl ? [resolveImageUrl(slide.imageUrl)] : []
                          }
                        />
                        <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="removeImage"
                            className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                          />
                          Supprimer l&apos;image actuelle
                        </label>
                        <Field label="Alt image" htmlFor={`hero-alt-text-${slide.id}`}>
                          <Input
                            id={`hero-alt-text-${slide.id}`}
                            name="altText"
                            defaultValue={slide.altText || ""}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Ordre" htmlFor={`hero-sort-order-${slide.id}`}>
                          <Input
                            id={`hero-sort-order-${slide.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={200}
                            defaultValue={slide.sortOrder}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={slide.isActive}
                            className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                          />
                          Slide actif
                        </label>

                        <AdminSubmitButton
                          pendingLabel="Enregistrement..."
                          className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                        >
                          Enregistrer
                        </AdminSubmitButton>
                      </form>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun slide hero"
                description="Ajoutez votre premier slide pour alimenter le carousel."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
            Nouveau bloc
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Ajouter un bloc confiance
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Icones recommandees: {trustIconSuggestions.join(", ")}.
          </p>
          <form action={createHomeTrustItemAction} className="mt-6 space-y-5">
            <Field label="Titre" htmlFor="trust-title-create">
              <Input
                id="trust-title-create"
                name="title"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Description" htmlFor="trust-description-create">
              <Textarea
                id="trust-description-create"
                name="description"
                className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Icone" htmlFor="trust-icon-create">
              <Input
                id="trust-icon-create"
                name="icon"
                placeholder="truck"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Ordre" htmlFor="trust-sort-order-create">
              <Input
                id="trust-sort-order-create"
                name="sortOrder"
                type="number"
                min={0}
                max={200}
                defaultValue={0}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
              />
              Bloc actif
            </label>
            <AdminSubmitButton
              pendingLabel="Ajout..."
              className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
            >
              Ajouter le bloc
            </AdminSubmitButton>
          </form>
        </div>

        <div className={cn(adminSurfaceClassName, "p-6")}>
          <SectionHeading
            badge="Trust"
            title="Blocs de reassurance"
            description="Ces cartes sont affichees dans la section confiance de la homepage."
          />
          <div className="mt-6 space-y-4">
            {data.trustItems.length ? (
              data.trustItems.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Icone: {item.icon} · Ordre: {item.sortOrder}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill
                        value={item.isActive ? "active" : "inactive"}
                        label={item.isActive ? "Actif" : "Inactif"}
                      />
                      <form action={deleteHomeTrustItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <AdminDeleteButton confirmMessage={`Supprimer "${item.title}" ?`} />
                      </form>
                    </div>
                  </div>

                  <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      Modifier ce bloc
                    </summary>
                    <div className="border-t border-slate-200 p-5">
                      <form action={updateHomeTrustItemAction} className="space-y-5">
                        <input type="hidden" name="id" value={item.id} />
                        <Field label="Titre" htmlFor={`trust-title-${item.id}`}>
                          <Input
                            id={`trust-title-${item.id}`}
                            name="title"
                            defaultValue={item.title}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Description" htmlFor={`trust-description-${item.id}`}>
                          <Textarea
                            id={`trust-description-${item.id}`}
                            name="description"
                            defaultValue={item.description}
                            className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Icone" htmlFor={`trust-icon-${item.id}`}>
                          <Input
                            id={`trust-icon-${item.id}`}
                            name="icon"
                            defaultValue={item.icon}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Ordre" htmlFor={`trust-sort-order-${item.id}`}>
                          <Input
                            id={`trust-sort-order-${item.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={200}
                            defaultValue={item.sortOrder}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={item.isActive}
                            className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                          />
                          Bloc actif
                        </label>
                        <AdminSubmitButton
                          pendingLabel="Enregistrement..."
                          className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                        >
                          Enregistrer
                        </AdminSubmitButton>
                      </form>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun bloc confiance"
                description="Ajoutez vos premiers arguments de reassurance."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
            Nouveau lien
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Ajouter un lien storefront
          </h2>
          <form action={createSiteLinkAction} className="mt-6 space-y-5">
            <Field label="Groupe" htmlFor="site-link-group">
              <select
                id="site-link-group"
                name="group"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                defaultValue="header"
              >
                {linkGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titre" htmlFor="site-link-title">
              <Input
                id="site-link-title"
                name="title"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Lien" htmlFor="site-link-href">
              <Input
                id="site-link-href"
                name="href"
                placeholder="/shop"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Ordre" htmlFor="site-link-sort-order">
              <Input
                id="site-link-sort-order"
                name="sortOrder"
                type="number"
                min={0}
                max={200}
                defaultValue={0}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="openInNewTab"
                className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
              />
              Ouvrir dans un nouvel onglet
            </label>
            <AdminSubmitButton
              pendingLabel="Ajout..."
              className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
            >
              Ajouter le lien
            </AdminSubmitButton>
          </form>
        </div>

        <div className={cn(adminSurfaceClassName, "p-6")}>
          <SectionHeading
            badge="Navigation"
            title="Liens header et footer"
            description="Chaque lien est relie a un groupe: header, footer rapide ou footer legal."
          />
          <div className="mt-6 space-y-4">
            {data.links.length ? (
              data.links.map((link) => (
                <div key={link.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{link.title}</h4>
                      <p className="text-sm text-slate-600">{link.href}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Groupe: {link.group} · Ordre: {link.sortOrder}
                      </p>
                    </div>
                    <form action={deleteSiteLinkAction}>
                      <input type="hidden" name="id" value={link.id} />
                      <AdminDeleteButton confirmMessage={`Supprimer le lien "${link.title}" ?`} />
                    </form>
                  </div>

                  <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      Modifier ce lien
                    </summary>
                    <div className="border-t border-slate-200 p-5">
                      <form action={updateSiteLinkAction} className="space-y-5">
                        <input type="hidden" name="id" value={link.id} />
                        <Field label="Groupe" htmlFor={`site-link-group-${link.id}`}>
                          <select
                            id={`site-link-group-${link.id}`}
                            name="group"
                            defaultValue={link.group}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                          >
                            {linkGroups.map((group) => (
                              <option key={group.value} value={group.value}>
                                {group.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Titre" htmlFor={`site-link-title-${link.id}`}>
                          <Input
                            id={`site-link-title-${link.id}`}
                            name="title"
                            defaultValue={link.title}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Lien" htmlFor={`site-link-href-${link.id}`}>
                          <Input
                            id={`site-link-href-${link.id}`}
                            name="href"
                            defaultValue={link.href}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Ordre" htmlFor={`site-link-sort-order-${link.id}`}>
                          <Input
                            id={`site-link-sort-order-${link.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={200}
                            defaultValue={link.sortOrder}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="openInNewTab"
                            defaultChecked={link.openInNewTab}
                            className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                          />
                          Ouvrir dans un nouvel onglet
                        </label>
                        <AdminSubmitButton
                          pendingLabel="Enregistrement..."
                          className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                        >
                          Enregistrer
                        </AdminSubmitButton>
                      </form>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun lien configure"
                description="Ajoutez vos liens header/footer pour piloter la navigation."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
            Nouveau social
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Ajouter un reseau social
          </h2>
          <form action={createSiteSocialLinkAction} className="mt-6 space-y-5">
            <Field label="Plateforme" htmlFor="social-platform">
              <Input
                id="social-platform"
                name="platform"
                placeholder="instagram"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Titre" htmlFor="social-title">
              <Input
                id="social-title"
                name="title"
                placeholder="Instagram"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Lien" htmlFor="social-href">
              <Input
                id="social-href"
                name="href"
                placeholder="https://..."
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <Field label="Ordre" htmlFor="social-sort-order">
              <Input
                id="social-sort-order"
                name="sortOrder"
                type="number"
                min={0}
                max={200}
                defaultValue={0}
                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="openInNewTab"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
              />
              Ouvrir dans un nouvel onglet
            </label>
            <AdminSubmitButton
              pendingLabel="Ajout..."
              className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
            >
              Ajouter le reseau
            </AdminSubmitButton>
          </form>
        </div>

        <div className={cn(adminSurfaceClassName, "p-6")}>
          <SectionHeading
            badge="Social"
            title="Reseaux sociaux"
            description="Ces liens sont affiches dans le footer et la navigation mobile."
          />
          <div className="mt-6 space-y-4">
            {data.socialLinks.length ? (
              data.socialLinks.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{item.title}</h4>
                      <p className="text-sm text-slate-600">{item.href}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Plateforme: {item.platform} · Ordre: {item.sortOrder}
                      </p>
                    </div>
                    <form action={deleteSiteSocialLinkAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <AdminDeleteButton confirmMessage={`Supprimer "${item.title}" ?`} />
                    </form>
                  </div>

                  <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      Modifier ce reseau
                    </summary>
                    <div className="border-t border-slate-200 p-5">
                      <form action={updateSiteSocialLinkAction} className="space-y-5">
                        <input type="hidden" name="id" value={item.id} />
                        <Field label="Plateforme" htmlFor={`social-platform-${item.id}`}>
                          <Input
                            id={`social-platform-${item.id}`}
                            name="platform"
                            defaultValue={item.platform}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Titre" htmlFor={`social-title-${item.id}`}>
                          <Input
                            id={`social-title-${item.id}`}
                            name="title"
                            defaultValue={item.title}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Lien" htmlFor={`social-href-${item.id}`}>
                          <Input
                            id={`social-href-${item.id}`}
                            name="href"
                            defaultValue={item.href}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <Field label="Ordre" htmlFor={`social-sort-order-${item.id}`}>
                          <Input
                            id={`social-sort-order-${item.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={200}
                            defaultValue={item.sortOrder}
                            className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                          />
                        </Field>
                        <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="openInNewTab"
                            defaultChecked={item.openInNewTab}
                            className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                          />
                          Ouvrir dans un nouvel onglet
                        </label>
                        <AdminSubmitButton
                          pendingLabel="Enregistrement..."
                          className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                        >
                          Enregistrer
                        </AdminSubmitButton>
                      </form>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun reseau social"
                description="Ajoutez vos liens sociaux pour completer le footer."
              />
            )}
          </div>
        </div>
      </section>

      <section className={cn(adminSurfaceClassName, "p-6")}>
        <SectionHeading
          badge="Acquisition"
          title="Newsletter"
          description="Nombre d'abonnes actifs actuellement enregistres."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={UserRoundPlus}
            label="Abonnes actifs"
            value={new Intl.NumberFormat("fr-MA").format(data.metrics.newsletterSubscribers)}
            helper="Adresses e-mail enregistrees depuis le formulaire homepage."
            tone="bg-sky-50 text-sky-700 ring-sky-200"
          />
          <MetricCard
            icon={Megaphone}
            label="Liens header"
            value={new Intl.NumberFormat("fr-MA").format(data.metrics.headerLinks)}
            helper="Entrees de navigation principales."
            tone="bg-amber-50 text-amber-700 ring-amber-200"
          />
          <MetricCard
            icon={Globe2}
            label="Reseaux sociaux"
            value={new Intl.NumberFormat("fr-MA").format(data.metrics.socialLinks)}
            helper="Liens sociaux affiches sur la boutique."
            tone="bg-emerald-50 text-emerald-700 ring-emerald-200"
          />
        </div>
      </section>
    </div>
  );
}
