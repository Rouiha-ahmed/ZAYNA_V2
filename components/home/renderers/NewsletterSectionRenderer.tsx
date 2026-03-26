import HomeNewsletter from "@/components/home/HomeNewsletter";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type NewsletterSectionRendererProps = {
  section: HomepageDynamicSection;
};

const readConfigText = (
  config: Record<string, unknown>,
  key: string,
  fallback: string
) => {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : fallback;
};

export default function NewsletterSectionRenderer({
  section,
}: NewsletterSectionRendererProps) {
  const title = section.title;
  const description = section.subtitle || "";

  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeNewsletter
        title={title}
        description={description}
        placeholder={readConfigText(section.config, "placeholder", "Votre adresse e-mail")}
        buttonLabel={readConfigText(section.config, "buttonLabel", "S'abonner")}
        successMessage={readConfigText(
          section.config,
          "successMessage",
          "Merci, votre inscription a bien ete prise en compte."
        )}
        errorMessage={readConfigText(
          section.config,
          "errorMessage",
          "Impossible de valider votre inscription pour le moment."
        )}
      />
    </section>
  );
}
