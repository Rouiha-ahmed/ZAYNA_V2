import {
  createHomepageProductSectionAction,
  deleteHomepageProductSectionAction,
  reorderHomepageProductSectionAction,
  toggleHomepageProductSectionStatusAction,
  updateHomepageProductSectionAction,
} from "@/app/admin/actions";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import {
  EmptyState,
  SectionHeading,
  StatusPill,
  adminSurfaceClassName,
} from "@/components/admin/AdminPagePrimitives";
import HomepageProductSectionForm from "@/components/admin/homepage/HomepageProductSectionForm";
import SectionOrderControls from "@/components/admin/homepage/SectionOrderControls";
import SectionStatusToggle from "@/components/admin/homepage/SectionStatusToggle";
import type { AdminHomepageProductSectionsData } from "@/lib/admin-homepage-product-sections";
import { cn } from "@/lib/utils";

type HomepageProductSectionsAdminListProps = {
  data: AdminHomepageProductSectionsData;
};

export default function HomepageProductSectionsAdminList({
  data,
}: HomepageProductSectionsAdminListProps) {
  if (!data.isSchemaReady) {
    return (
      <section className={cn(adminSurfaceClassName, "p-6")}>
        <EmptyState
          title="Sections produits indisponibles"
          description="Les tables HomepageProductSection ne sont pas encore migrees. Lancez la migration Prisma puis rechargez cette page."
        />
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className={cn(adminSurfaceClassName, "p-6")}>
        <SectionHeading
          badge="Sections produits"
          title="Ajouter une section"
          description="Creez un bloc produits personnalise avec le meme style visuel que Promotions et Meilleures ventes."
        />

        <div className="mt-6">
          <HomepageProductSectionForm
            mode="create"
            products={data.products}
            action={createHomepageProductSectionAction}
            submitLabel="Ajouter la section"
            pendingLabel="Ajout..."
          />
        </div>
      </div>

      <div className={cn(adminSurfaceClassName, "p-6")}>
        <SectionHeading
          badge="Gestion"
          title="Sections produits existantes"
          description="Modifiez les titres, produits, ordre et statut des sections."
        />

        <div className="mt-6 space-y-4">
          {data.sections.length ? (
            data.sections.map((section, index) => (
              <div
                key={section.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-slate-950">{section.title}</h4>
                      <StatusPill
                        value={section.isActive ? "active" : "inactive"}
                        label={section.isActive ? "Actif" : "Inactif"}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      slug: {section.slug} · ordre: {section.order}
                    </p>
                    <p className="text-xs text-slate-500">
                      {section.productIds.length} produit(s) dans la section
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <SectionOrderControls
                      sectionId={section.id}
                      canMoveUp={index > 0}
                      canMoveDown={index < data.sections.length - 1}
                      action={reorderHomepageProductSectionAction}
                    />

                    <SectionStatusToggle
                      sectionId={section.id}
                      isActive={section.isActive}
                      action={toggleHomepageProductSectionStatusAction}
                    />

                    <form action={deleteHomepageProductSectionAction}>
                      <input type="hidden" name="id" value={section.id} />
                      <AdminDeleteButton
                        confirmMessage={`Supprimer la section "${section.title}" ?`}
                      />
                    </form>
                  </div>
                </div>

                <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                    Modifier cette section
                  </summary>
                  <div className="border-t border-slate-200 p-5">
                    <HomepageProductSectionForm
                      mode="edit"
                      section={section}
                      products={data.products}
                      action={updateHomepageProductSectionAction}
                      submitLabel="Enregistrer"
                      pendingLabel="Enregistrement..."
                    />
                  </div>
                </details>
              </div>
            ))
          ) : (
            <EmptyState
              title="Aucune section produit personnalisee"
              description="Ajoutez votre premiere section pour afficher automatiquement vos produits sur la homepage."
            />
          )}
        </div>
      </div>
    </section>
  );
}
