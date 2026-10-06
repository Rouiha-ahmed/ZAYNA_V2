import { normalizeCategoryName } from "@/lib/categories";

export type CatalogueTaxonomyItem = {
  slug: string;
  title: string;
  parentSlug: string | null;
  description: string;
  order: number;
  featured?: boolean;
};

export const CATALOGUE_TAXONOMY: CatalogueTaxonomyItem[] = [
  { slug: "visage", title: "Visage", parentSlug: null, description: "Soins et hygiène du visage.", order: 10, featured: true },
  { slug: "nettoyants-demaquillants", title: "Nettoyants & Démaquillants", parentSlug: "visage", description: "Nettoyants, eaux micellaires et démaquillants visage.", order: 11 },
  { slug: "hydratants-visage", title: "Hydratants Visage", parentSlug: "visage", description: "Crèmes, fluides et soins hydratants du visage.", order: 12 },
  { slug: "serums-concentres", title: "Sérums & Concentrés", parentSlug: "visage", description: "Sérums, ampoules et concentrés visage.", order: 13 },
  { slug: "anti-age", title: "Anti-âge", parentSlug: "visage", description: "Soins anti-rides, fermeté et correction des signes de l’âge.", order: 14 },
  { slug: "acne-imperfections", title: "Acné & Imperfections", parentSlug: "visage", description: "Soins ciblés pour l’acné et les imperfections.", order: 15 },
  { slug: "anti-taches-eclat", title: "Anti-taches & Éclat", parentSlug: "visage", description: "Soins dépigmentants, anti-taches et éclat.", order: 16 },
  { slug: "contour-des-yeux", title: "Contour des yeux", parentSlug: "visage", description: "Soins du contour de l’œil et du regard.", order: 17 },
  { slug: "masques-exfoliants", title: "Masques & Exfoliants", parentSlug: "visage", description: "Masques, peelings, gommages et exfoliants visage.", order: 18 },
  { slug: "soins-des-levres", title: "Soins des lèvres", parentSlug: "visage", description: "Baumes et soins réparateurs des lèvres.", order: 19 },
  { slug: "peaux-sensibles-rougeurs", title: "Peaux sensibles & Rougeurs", parentSlug: "visage", description: "Soins apaisants pour peaux sensibles et sujettes aux rougeurs.", order: 20 },
  { slug: "soins-visage", title: "Soins Visage", parentSlug: "visage", description: "Autres soins spécifiques du visage.", order: 21 },

  { slug: "cheveux", title: "Cheveux", parentSlug: null, description: "Hygiène, traitements et coiffage capillaires.", order: 30, featured: true },
  { slug: "shampooings", title: "Shampooings", parentSlug: "cheveux", description: "Shampooings et lavants capillaires.", order: 31 },
  { slug: "apres-shampooings", title: "Après-shampooings", parentSlug: "cheveux", description: "Après-shampooings et démêlants.", order: 32 },
  { slug: "masques-soins-cheveux", title: "Masques & Soins Cheveux", parentSlug: "cheveux", description: "Masques, huiles, sérums et traitements capillaires.", order: 33 },
  { slug: "anti-chute", title: "Anti-chute", parentSlug: "cheveux", description: "Soins capillaires anti-chute et densité.", order: 34 },
  { slug: "colorations", title: "Colorations", parentSlug: "cheveux", description: "Colorations et soins repigmentants.", order: 35 },
  { slug: "coiffage", title: "Coiffage", parentSlug: "cheveux", description: "Produits de coiffage et fixation.", order: 36 },
  { slug: "accessoires-cheveux", title: "Accessoires Cheveux", parentSlug: "cheveux", description: "Brosses et accessoires capillaires.", order: 37 },

  { slug: "corps", title: "Corps", parentSlug: null, description: "Hygiène et soins du corps.", order: 40, featured: true },
  { slug: "hygiene-corps", title: "Hygiène Corps", parentSlug: "corps", description: "Gels douche, savons et lavants du corps.", order: 41 },
  { slug: "hydratation-corps", title: "Hydratation Corps", parentSlug: "corps", description: "Laits, baumes, huiles et crèmes hydratantes corps.", order: 42 },
  { slug: "deodorants", title: "Déodorants", parentSlug: "corps", description: "Déodorants et anti-transpirants.", order: 43 },
  { slug: "mains-pieds", title: "Mains & Pieds", parentSlug: "corps", description: "Soins des mains, pieds et ongles non maquillants.", order: 44 },
  { slug: "minceur-corps", title: "Minceur Corps", parentSlug: "corps", description: "Soins minceur, fermeté et anti-cellulite du corps.", order: 45 },
  { slug: "soins-corps", title: "Soins Corps", parentSlug: "corps", description: "Autres soins dermatologiques du corps.", order: 46 },

  { slug: "solaire", title: "Solaire", parentSlug: null, description: "Protections solaires, autobronzants et après-soleil.", order: 50, featured: true },

  { slug: "bebe-maman", title: "Bébé & Maman", parentSlug: null, description: "Produits pour bébé, maternité et allaitement.", order: 60, featured: true },
  { slug: "alimentation-bebe", title: "Alimentation Bébé", parentSlug: "bebe-maman", description: "Laits, repas et alimentation infantile.", order: 61 },
  { slug: "hygiene-soins-bebe", title: "Hygiène & Soins Bébé", parentSlug: "bebe-maman", description: "Hygiène, change et soins de la peau de bébé.", order: 62 },
  { slug: "accessoires-bebe", title: "Accessoires Bébé", parentSlug: "bebe-maman", description: "Biberons, tétines et accessoires de puériculture.", order: 63 },
  { slug: "grossesse-allaitement", title: "Grossesse & Allaitement", parentSlug: "bebe-maman", description: "Soins et accessoires de maternité et d’allaitement.", order: 64 },

  { slug: "hygiene-bucco-dentaire", title: "Hygiène bucco-dentaire", parentSlug: null, description: "Hygiène et soins des dents et de la bouche.", order: 70, featured: true },
  { slug: "dentifrices", title: "Dentifrices", parentSlug: "hygiene-bucco-dentaire", description: "Dentifrices et gels dentaires.", order: 71 },
  { slug: "brosses-a-dents", title: "Brosses à dents", parentSlug: "hygiene-bucco-dentaire", description: "Brosses à dents et brossettes interdentaires.", order: 72 },
  { slug: "bains-de-bouche", title: "Bains de bouche", parentSlug: "hygiene-bucco-dentaire", description: "Bains de bouche et solutions de rinçage.", order: 73 },
  { slug: "soins-dentaires", title: "Soins dentaires", parentSlug: "hygiene-bucco-dentaire", description: "Fils dentaires, soins des gencives et autres accessoires.", order: 74 },

  { slug: "complements-alimentaires", title: "Compléments alimentaires", parentSlug: null, description: "Compléments nutritionnels et micronutrition.", order: 80, featured: true },
  { slug: "vitamines-mineraux", title: "Vitamines & Minéraux", parentSlug: "complements-alimentaires", description: "Vitamines, minéraux et oligo-éléments.", order: 81 },
  { slug: "digestion-detox", title: "Digestion & Détox", parentSlug: "complements-alimentaires", description: "Digestion, transit, foie et détox.", order: 82 },
  { slug: "sommeil-stress", title: "Sommeil & Stress", parentSlug: "complements-alimentaires", description: "Sommeil, stress, humeur et relaxation.", order: 83 },
  { slug: "immunite-vitalite", title: "Immunité & Vitalité", parentSlug: "complements-alimentaires", description: "Immunité, énergie et tonus.", order: 84 },
  { slug: "articulations-muscles", title: "Articulations & Muscles", parentSlug: "complements-alimentaires", description: "Confort articulaire, os et récupération musculaire.", order: 85 },
  { slug: "beaute-peau-cheveux-ongles", title: "Beauté Peau, Cheveux & Ongles", parentSlug: "complements-alimentaires", description: "Compléments beauté pour peau, cheveux et ongles.", order: 86 },
  { slug: "minceur-metabolisme", title: "Minceur & Métabolisme", parentSlug: "complements-alimentaires", description: "Compléments minceur, drainage et métabolisme.", order: 87 },
  { slug: "nutrition-sportive", title: "Nutrition sportive", parentSlug: "complements-alimentaires", description: "Protéines, créatine et nutrition pour l’effort.", order: 88 },
  { slug: "sante-generale", title: "Santé générale", parentSlug: "complements-alimentaires", description: "Autres compléments alimentaires ciblés.", order: 89 },

  { slug: "maquillage", title: "Maquillage", parentSlug: null, description: "Produits de maquillage.", order: 90, featured: true },
  { slug: "maquillage-teint", title: "Teint", parentSlug: "maquillage", description: "Fonds de teint, poudres, blushs et correcteurs maquillage.", order: 91 },
  { slug: "maquillage-yeux", title: "Yeux", parentSlug: "maquillage", description: "Mascara, eyeliner et maquillage des yeux.", order: 92 },
  { slug: "maquillage-levres", title: "Lèvres", parentSlug: "maquillage", description: "Rouges à lèvres, gloss et crayons à lèvres.", order: 93 },
  { slug: "maquillage-ongles", title: "Ongles", parentSlug: "maquillage", description: "Vernis et maquillage des ongles.", order: 94 },

  { slug: "parfums", title: "Parfums", parentSlug: null, description: "Eaux de parfum, eaux de toilette et brumes parfumées.", order: 100 },
  { slug: "hygiene-intime", title: "Hygiène intime", parentSlug: null, description: "Hygiène, confort et soins intimes.", order: 110 },
  { slug: "homme", title: "Homme", parentSlug: null, description: "Rasage, barbe et soins spécifiquement masculins.", order: 120 },
  { slug: "rasage-barbe", title: "Rasage & Barbe", parentSlug: "homme", description: "Rasage, après-rasage et entretien de la barbe.", order: 121 },

  { slug: "maison", title: "Maison", parentSlug: null, description: "Produits d’entretien de la maison et du linge.", order: 125 },
  { slug: "entretien-du-linge", title: "Entretien du linge", parentSlug: "maison", description: "Lessives et soins du linge.", order: 126 },

  { slug: "sante-bien-etre", title: "Santé & Bien-être", parentSlug: null, description: "Premiers soins, dispositifs et bien-être quotidien.", order: 130 },
  { slug: "premiers-soins", title: "Premiers soins", parentSlug: "sante-bien-etre", description: "Antiseptiques, pansements et soins des plaies.", order: 131 },
  { slug: "orl-respiration", title: "ORL & Respiration", parentSlug: "sante-bien-etre", description: "Nez, gorge, oreilles et respiration.", order: 132 },
  { slug: "anti-insectes-poux", title: "Anti-insectes & Poux", parentSlug: "sante-bien-etre", description: "Répulsifs, moustiques, poux et lentes.", order: 133 },
  { slug: "sante-sexuelle", title: "Santé sexuelle", parentSlug: "sante-bien-etre", description: "Préservatifs, lubrifiants et bien-être sexuel.", order: 134 },
  { slug: "materiel-medical", title: "Matériel médical", parentSlug: "sante-bien-etre", description: "Thermomètres, tests et petit matériel médical.", order: 135 },
  { slug: "aromatherapie", title: "Aromathérapie", parentSlug: "sante-bien-etre", description: "Huiles essentielles et produits d’aromathérapie.", order: 136 },
  { slug: "douleurs-muscles", title: "Douleurs & Muscles", parentSlug: "sante-bien-etre", description: "Gels, huiles et dispositifs pour le confort musculaire et articulaire.", order: 137 },
];

export type ProductClassificationInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  tags?: string[];
};

export type ProductClassification = {
  categorySlugs: string[];
  confidence: "HIGH" | "MEDIUM" | "REVIEW";
  reason: string;
  evidence: string[];
};

const normalized = (value: string | null | undefined) =>
  normalizeCategoryName(value || "");

const hasAny = (value: string, expressions: RegExp[]) =>
  expressions.some((expression) => expression.test(value));

const titleRules = (...values: string[]) =>
  values.map((value) => new RegExp(`(?:^|\\s)${value}(?:\\s|$)`, "i"));

const dosageForm = titleRules(
  "gelules?", "capsules?", "comprimes?", "softgels?", "gummies?",
  "probiotiques?", "multivitamines?",
);

const result = (
  categorySlugs: string[],
  reason: string,
  evidence: string[],
  confidence: ProductClassification["confidence"] = "HIGH",
): ProductClassification => ({
  categorySlugs: [...new Set(categorySlugs)],
  confidence,
  reason,
  evidence,
});

export function classifyProduct(input: ProductClassificationInput): ProductClassification {
  const name = normalized(input.name);
  const slug = normalized(input.slug);
  const tags = normalized((input.tags || []).join(" "));
  const description = normalized(input.description);
  const title = `${name} ${slug} ${tags}`.trim();
  const context = `${title} ${description}`.trim();
  const matchTitle = (patterns: RegExp[]) => hasAny(title, patterns);
  const matchContext = (patterns: RegExp[]) => hasAny(context, patterns);
  const sizeMatch = name.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(ml|g)(?:\s|$)/);
  const size = sizeMatch ? Number(sizeMatch[1].replace(",", ".")) : null;

  if (matchTitle(titleRules("lessive", "adoucissant linge", "detergent linge")))
    return result(["entretien-du-linge"], "Entretien du linge explicite", [input.name]);

  if (matchTitle(titleRules("biberons?", "tetines?", "sucettes?", "anneaux? de dentition", "tasses?", "goupillons?", "chauffe biberon", "sterilisateurs?")))
    return result(["accessoires-bebe"], "Accessoire de puériculture explicite", [input.name]);
  if (matchTitle(titleRules("lait infantile", "lait 1er age", "lait 2eme age", "lait croissance", "cereales? bebe", "petits? pots?", "compotes? bebe", "babybio")))
    return result(["alimentation-bebe"], "Alimentation infantile explicite", [input.name]);
  if (matchTitle(titleRules("grossesse", "allaitement", "maternite", "mamelons?", "tire lait", "coussinets?", "post partum", "vergetures?", "lait maternel")))
    return result(["grossesse-allaitement"], "Maternité ou allaitement explicite", [input.name]);
  if (matchTitle(titleRules("bebe", "baby", "nourrisson", "enfants?", "pediakid", "premiere peau", "pate ultra protectrice", "liniment", "change", "couches?"))) {
    const categories = ["hygiene-soins-bebe"];
    if (matchTitle(titleRules("solaire", "spf", "sun", "photoprotection"))) categories.push("solaire");
    return result(categories, "Produit bébé/enfant explicitement identifié", [input.name]);
  }

  if (matchTitle(titleRules("dentifrices?", "toothpaste")))
    return result(["dentifrices"], "Dentifrice explicite", [input.name]);
  if (matchTitle(titleRules("brosses? a dents?", "brossettes?", "interdentaires?", "recharges? brosse", "sonic", "oral b")))
    return result(["brosses-a-dents"], "Brosse ou brossette dentaire explicite", [input.name]);
  if (matchTitle(titleRules("bains? de bouche", "mouthwash", "solution buccale")))
    return result(["bains-de-bouche"], "Bain de bouche explicite", [input.name]);
  if (matchTitle(titleRules("dentaire", "dents?", "gencives?", "gingival", "buccal", "bucco", "curasept", "novafix", "cremes? adhesives?", "fil dentaire", "flossers?", "soft picks", "gratte langue", "hydropulseur", "haleine", "aphtes?", "post intervention")))
    return result(["soins-dentaires"], "Soin bucco-dentaire explicite", [input.name]);

  if (matchTitle(titleRules("preservatifs?", "lubrifiants?", "intimy", "manix", "skyn", "test de grossesse", "test ovulation")))
    return result(["sante-sexuelle"], "Santé sexuelle explicite", [input.name]);
  if (matchTitle(titleRules("intime", "intimes", "toilette intime", "secheresse vaginale", "vaginal", "vulvaire", "mycose", "serviettes? hygieniques?", "ailettes?", "tampons?", "protege slips?", "incontinence")))
    return result(["hygiene-intime"], "Hygiène ou confort intime explicite", [input.name]);

  if (matchTitle(titleRules("mascara", "eyeliner", "eye liner", "liner gel", "liner gel pen", "fard", "palette yeux", "crayon yeux", "kajal", "sourcils?")))
    return result(["maquillage-yeux"], "Maquillage des yeux explicite", [input.name]);
  if (matchTitle(titleRules("rouges? a levres?", "gloss", "lipstick", "lip liner", "crayon levres", "crayon pour levres", "vinyl ink", "lifter gloss", "lifter liner")))
    return result(["maquillage-levres"], "Maquillage des lèvres explicite", [input.name]);
  if (matchTitle(titleRules("vernis", "nail polish")))
    return result(["maquillage-ongles"], "Vernis à ongles explicite", [input.name]);
  if (matchTitle(titleRules("fond de teint", "poudres?", "blush", "bronzer", "anti cernes?", "anticernes?", "concealer", "correcteur teint", "base perfectrice", "bb creme", "cc creme", "highlighter", "superstay"))) {
    const categories = ["maquillage-teint"];
    if (matchTitle(titleRules("spf", "solaire"))) categories.push("solaire");
    return result(categories, "Maquillage du teint explicite", [input.name]);
  }

  if (matchTitle(titleRules("eau de parfum", "eau de toilette", "eau fraiche", "eau parfumee", "parfum", "parfumante", "brume parfumee", "cologne")))
    return result(["parfums"], "Parfum explicite", [input.name]);

  const isSupplement = matchTitle(dosageForm) || matchTitle(titleRules(
    "complements? alimentaires?", "vitamines?", "magnesium", "zinc", "fer", "omega", "collagene",
    "melatonine", "probiotiques?", "spiruline", "gelee royale", "levure de biere", "pure collagen",
  )) || matchContext(titleRules("complements? alimentaires?", "supplements? alimentaires?"));
  if (isSupplement) {
    if (matchTitle(titleRules("cheveux", "ongles", "peau", "collagene", "acide hyaluronique", "beauty", "capillaire")))
      return result(["beaute-peau-cheveux-ongles"], "Complément beauté explicite", [input.name]);
    if (matchTitle(titleRules("sommeil", "stress", "relax", "melatonine", "anxiete", "humeur", "zen")))
      return result(["sommeil-stress"], "Complément sommeil/stress explicite", [input.name]);
    if (matchTitle(titleRules("digestion", "transit", "foie", "detox", "charbon", "probiotiques?", "ballonnements?", "constipation", "radis noir", "artichaut")))
      return result(["digestion-detox"], "Complément digestion/détox explicite", [input.name]);
    if (matchTitle(titleRules("articulations?", "muscles?", "os", "cartilage", "glucosamine", "crampes?")))
      return result(["articulations-muscles"], "Complément articulations/muscles explicite", [input.name]);
    if (matchTitle(titleRules("minceur", "brule graisse", "drainage", "metabolisme", "coupe faim", "draineur")))
      return result(["minceur-metabolisme"], "Complément minceur/métabolisme explicite", [input.name]);
    if (matchTitle(titleRules("immunite", "energie", "vitalite", "tonus", "fatigue", "ginseng", "echinacee", "acerola")))
      return result(["immunite-vitalite"], "Complément immunité/vitalité explicite", [input.name]);
    if (matchTitle(titleRules("proteines?", "protein", "creatine", "bcaa", "whey", "prise de masse", "sport")))
      return result(["nutrition-sportive"], "Nutrition sportive explicite", [input.name]);
    if (matchTitle(titleRules("vitamines?", "magnesium", "zinc", "fer", "calcium", "selenium", "vitamine [a-z0-9]+", "multivitamines?")))
      return result(["vitamines-mineraux"], "Vitamine ou minéral explicite", [input.name]);
    return result(["sante-generale"], "Forme galénique de complément alimentaire", [input.name], "MEDIUM");
  }

  const hasOralCourseForm = matchTitle(titleRules(
    "ampoules?", "solutions? buvables?", "sachets?", "sticks?", "pastilles?",
  ));
  if (matchTitle(titleRules("proteines?", "protein", "creatine", "bcaa", "whey", "prise de masse")))
    return result(["nutrition-sportive"], "Nutrition sportive explicite", [input.name]);
  if (matchTitle(titleRules("collagenium", "kollagen beauty", "pure white glutathion")))
    return result(["beaute-peau-cheveux-ongles"], "Cure beauté explicite", [input.name], "MEDIUM");
  if (matchTitle(titleRules("detox [0-9]+ organes", "turbo draine")))
    return result(["minceur-metabolisme"], "Cure détox ou drainage explicite", [input.name], "MEDIUM");
  if (matchTitle(titleRules("ginkgo biloba", "memo viv", "capital cerebral", "gouttes propolis", "oleopolis", "uricalm", "proman forte")))
    return result(["sante-generale"], "Complément de santé ciblé", [input.name], "MEDIUM");
  if (matchTitle(titleRules("harpagophytum")))
    return result(["articulations-muscles"], "Complément articulaire explicite", [input.name], "MEDIUM");
  if ((hasOralCourseForm || matchTitle(titleRules("complemax", "doppel herz"))) && matchTitle(titleRules("detox", "detoxification", "transit", "digestion", "radis noir", "artichaut", "foie", "lacto pro", "lactobacillus", "gastrique")))
    return result(["digestion-detox"], "Cure digestion/détox explicite", [input.name], "MEDIUM");
  if (hasOralCourseForm && matchTitle(titleRules("sommeil", "stress", "memoire", "relax", "serenite")))
    return result(["sommeil-stress"], "Cure sommeil/stress explicite", [input.name], "MEDIUM");
  if ((hasOralCourseForm || matchTitle(titleRules("complemax", "doppel herz"))) && matchTitle(titleRules("ginseng", "maca", "macamax", "propolis", "gelee royale", "immunite", "vitalite", "tonus")))
    return result(["immunite-vitalite"], "Cure immunité/vitalité explicite", [input.name], "MEDIUM");
  if ((hasOralCourseForm || matchTitle(titleRules("complemax", "doppel herz"))) && matchTitle(titleRules("minceur", "brule graisse", "perte de poids", "draineur", "glycemie", "glycemia")))
    return result(["minceur-metabolisme"], "Cure minceur/métabolisme explicite", [input.name], "MEDIUM");

  if (matchTitle(titleRules("colorations?", "nutricolor", "teinture cheveux", "retouche racines", "repigmentant", "color seal", "cool color")))
    return result(["colorations"], "Coloration capillaire explicite", [input.name]);
  if (matchTitle(titleRules("shampooings?", "shampoings?", "shampoos?")))
    return result(["shampooings"], "Shampooing explicite", [input.name]);
  if (matchTitle(titleRules("apres shampooing", "apres shampoing", "conditioner", "demelant")))
    return result(["apres-shampooings"], "Après-shampooing explicite", [input.name]);
  if (matchTitle(titleRules("anti chute", "antichute", "chute cheveux", "densite capillaire", "pousse cheveux", "croissance cheveux", "croissance", "fortifiantes? cheveux")))
    return result(["anti-chute"], "Traitement anti-chute explicite", [input.name]);
  if (matchTitle(titleRules("laque", "hairspray", "hair spray", "wax", "cire", "clay", "mousse coiffante", "coiffante?", "styling", "fixation", "gel coiffant", "gel de lin", "cire cheveux", "spray volume", "texture volume", "straight balm", "curls definer")))
    return result(["coiffage"], "Produit de coiffage explicite", [input.name]);
  if (matchTitle(titleRules("brosse cheveux", "peigne", "accessoire cheveux", "brosse de massage capillaire")))
    return result(["accessoires-cheveux"], "Accessoire capillaire explicite", [input.name]);
  if (matchTitle(titleRules("cheveux", "capillaire", "cuir chevelu", "anti pelliculaire", "antipelliculaire", "pelliculaires?", "anti casse", "eau salee", "leave in", "sans rincage", "hair mask", "hair perfecting", "bond repairing", "smoothing treatment", "masque reparateur", "huile cheveux", "serum reparateur")))
    return result(["masques-soins-cheveux"], "Soin capillaire explicite", [input.name]);
  if (matchTitle(titleRules("capilift", "argan mystic oil", "hyaluronic velvet", "reparateur b11 biome", "coffret detox refresh")))
    return result(["masques-soins-cheveux"], "Soin capillaire identifié par sa gamme", [input.name], "MEDIUM");

  const isSolar = matchTitle(titleRules("spf", "spf[0-9]+", "solaire", "sun", "sunscreen", "photoderm", "anthelios", "uveblock", "fotoprotector", "apres soleil", "autobronzants?", "autobronzantes?"));
  if (isSolar) {
    const categories = ["solaire"];
    if (matchTitle(titleRules("visage", "facial", "face"))) categories.push("soins-visage");
    return result(categories, "Protection ou soin solaire explicite", [input.name]);
  }

  if (matchTitle(titleRules("deodorants?", "deo douche", "anti transpirant", "antitranspirant", "detranspirant")))
    return result(["deodorants"], "Déodorant explicite", [input.name]);
  if (matchTitle(titleRules("gel douche", "gelee de douche", "mousse de douche", "creme de douche", "huile de douche", "bain et douche", "creme lavante", "huile lavante", "pain surgras", "savon", "bain douche", "lavant corps", "soin lavant", "gel surgras", "douche surgras", "syndet", "base lavante", "gel lavant surgras")))
    return result(["hygiene-corps"], "Produit lavant corps explicite", [input.name]);
  if (matchTitle(titleRules("creme mains", "mains", "pieds", "talons", "callosites", "crevasses", "cuticules?", "ongles?", "onifid", "nails?", "bouclier", "base protectrice", "barriere base", "mava strong", "dissolvant", "lime", "polissoir", "durcisseur")))
    return result(["mains-pieds"], "Soin mains ou pieds explicite", [input.name]);
  if (matchTitle(titleRules("minceur", "amincissant", "amincissante", "cellulite", "anti cellulite", "ventre plat", "ventre", "hanches", "abdo", "abdominaux", "remodelant", "remodelants", "drainant", "drainants", "fermete corps", "raffermissant corps")))
    return result(["minceur-corps"], "Soin minceur corps explicite", [input.name]);
  if (matchTitle(titleRules("lait corps", "lait corporel", "baume corps", "baume corporel", "beurre corps", "beurre fondant", "creme corps", "creme corporelle", "lotion corporelle", "hydratant corps", "hydratante corps", "huile corps", "body lotion", "body butter", "cold cream", "emollient", "emolliente", "relipidant", "relipidante", "atoderm", "lipikar", "xeracalm", "xemose", "ureadin", "uree pure")))
    return result(["hydratation-corps"], "Hydratation corps explicite", [input.name]);
  if (matchTitle(titleRules("corps", "body", "jambes", "buste")))
    return result(["soins-corps"], "Soin corps explicite", [input.name], "MEDIUM");

  if (matchTitle(titleRules("contour yeux", "contour des yeux", "soin yeux", "gel creme yeux", "eye contour", "regard", "poches", "cernes", "eye cream", "palpebral", "paupiere", "paupieres")))
    return result(["contour-des-yeux"], "Soin du contour des yeux explicite", [input.name]);
  if (matchTitle(titleRules("levres", "baume levres", "stick levres", "soin levres", "lip balm", "lip supreme balm")))
    return result(["soins-des-levres"], "Soin des lèvres explicite", [input.name]);
  if (matchTitle(titleRules("nettoyant", "nettoyante", "gel moussant", "mousse nettoyante", "micellaire", "demaquillant", "demaquillante", "cleanser", "cleansing", "lotion tonique", "tonique", "tonifiante", "toner")))
    return result(["nettoyants-demaquillants"], "Nettoyant ou démaquillant visage explicite", [input.name]);
  if (matchTitle(titleRules("serums?", "concentres?", "ampoules? visage", "ampoules? eclat", "ampoules? anti", "pure hyaluronic ampoule", "botulinum effect ampoule", "niacinamide [0-9]+", "acide hyaluronique [0-9]+", "booster visage")))
    return result(["serums-concentres"], "Sérum ou concentré visage explicite", [input.name]);
  if (matchTitle(titleRules("acne", "acnomega", "aknet", "acnefid", "acide azelaique", "blemish", "boutons?", "imperfections?", "anti imperfections", "comedons?", "points noirs", "sebium", "sebiaclear", "sebioclear", "sebiotic", "effaclar", "boreade", "keracnyl", "pate grise", "hyseac", "normaderm", "seboreg", "matiderm", "matifiant", "matifiante", "purifiant", "purifiante", "controle sebum", "perfect skin regul", "perfect skin spot", "pores", "mighty patch", "patchs? acne")))
    return result(["acne-imperfections"], "Acné ou imperfections explicites", [input.name]);
  if (matchTitle(titleRules("anti taches", "taches", "depigmentant", "depigmentante", "eclaircissant", "eclaircissante", "clarifiant", "clarifiante", "brightening", "radiance", "unifiant", "unifiante", "illuminatrice", "repigmentation", "vitix", "vitiskin", "vtlg", "vitilium", "vit go", "melan off", "pigmentbio", "pigment", "melasma", "eclat", "eclatante")))
    return result(["anti-taches-eclat"], "Anti-taches ou éclat explicite", [input.name]);
  if (matchTitle(titleRules("anti age", "anti rides", "anti wrinkle", "rides", "ridules", "retinol", "lifting", "lift", "fermete", "firming", "raffermissant", "raffermissante", "jeunesse", "multi correctrice", "collagen boost", "collagen biotic", "collagen specialist", "filler")))
    return result(["anti-age"], "Anti-âge ou anti-rides explicite", [input.name]);
  if (matchTitle(titleRules("masques?", "masks?", "gommages?", "gommante", "exfoliants?", "exfoliante", "exfoliating", "desincrustante", "peelings?", "night peel", "peel off", "glycoisdin", "glycolic acid", "aha", "bha")))
    return result(["masques-exfoliants"], "Masque ou exfoliant visage explicite", [input.name]);
  if (matchTitle(titleRules("rougeurs?", "rosacee", "peaux sensibles", "peaux seches", "toleriane", "tolederm", "sensidiane", "atopicontrol", "tolerance control", "sensibio", "sensitelial", "apaisant visage", "apaisante visage")))
    return result(["peaux-sensibles-rougeurs"], "Peau sensible ou rougeurs explicites", [input.name]);
  if (matchTitle(titleRules("visage", "facial", "face")) && matchTitle(titleRules("hydratant", "hydratante", "hydratation", "hyaluron", "creme jour", "creme nuit", "gel creme")))
    return result(["hydratants-visage"], "Hydratation du visage explicite", [input.name]);
  if (matchTitle(titleRules("visage", "facial", "face")))
    return result(["soins-visage"], "Soin du visage explicite", [input.name]);

  if (matchTitle(titleRules("eau thermale", "spray thermal")))
    return result(["soins-visage"], "Eau thermale de soin", [input.name], "MEDIUM");

  if (matchTitle(titleRules("creme jour", "creme de jour", "creme nuit", "creme de nuit", "soin nuit", "day cream", "night cream", "daily fluid", "barriere cutanee", "skin barrier")))
    return result(["soins-visage"], "Soin quotidien du visage explicite", [input.name], "MEDIUM");
  if (matchTitle(titleRules("hydratant", "hydratante", "hydratation", "moisturizing", "moisturising"))) {
    if (size !== null && size >= 150)
      return result(["hydratation-corps"], "Hydratant grand format attribué au corps", [input.name], "MEDIUM");
    return result(["hydratants-visage"], "Hydratant petit format attribué au visage", [input.name], "MEDIUM");
  }
  if (matchTitle(titleRules("cicalfate", "cicavit", "cica creme", "creme reparatrice", "repair cream")) && (size === null || size <= 100))
    return result(["soins-visage"], "Crème réparatrice dermatologique petit format", [input.name], "MEDIUM");
  if (matchTitle(titleRules("calming cream", "creme nourrissante", "cream nourrissante", "creme booster", "creme protectrice", "soin repulpant", "huile de nuit", "base lissante")))
    return result(["soins-visage"], "Soin cosmétique du visage", [input.name], "MEDIUM");
  if (matchTitle(titleRules("hydra creme", "creme legere", "creme riche", "creme fraiche", "creme nutritive", "soft cream", "skin renewal", "gel creme apaisant")))
    return result(["hydratants-visage"], "Crème hydratante cosmétique", [input.name], "MEDIUM");
  if (matchTitle(titleRules("huile de soin", "huile regenerante", "huile multi usage")))
    return result(["soins-corps"], "Huile de soin polyvalente", [input.name], "MEDIUM");

  if (matchTitle(titleRules("rasage", "apres rasage", "barbe", "beard")))
    return result(["rasage-barbe"], "Rasage ou barbe explicite", [input.name]);
  if (matchTitle(titleRules("anti poux", "poux", "zeropou", "lentes", "anti moustiques", "moustiques", "repulsif", "insectes", "anti parasitaire", "enviroscab")))
    return result(["anti-insectes-poux"], "Anti-poux ou anti-insectes explicite", [input.name]);
  if (matchTitle(titleRules("nasal", "nez", "gorge", "toux", "respiration", "oreilles?", "auriculaire", "inhalateur")))
    return result(["orl-respiration"], "ORL ou respiration explicite", [input.name]);
  if (matchTitle(titleRules("pansements?", "antiseptiques?", "desinfectant", "cicatrisant", "cicatrisante", "cicatrices?", "assechant", "assechante", "scargel", "gel silicone", "plaies?", "compresses?", "bandes?", "brulures?")))
    return result(["premiers-soins"], "Premier soin explicite", [input.name]);
  if (matchTitle(titleRules("thermometres?", "tensiometres?", "oxymetres?", "nebuliseurs?", "capteurs?", "surveillance continue", "tests?", "masques? chirurgicaux?", "bouillotte")))
    return result(["materiel-medical"], "Matériel ou test médical explicite", [input.name]);
  if (matchTitle(titleRules("huile essentielle", "huiles essentielles", "diffuseur", "aromatherapie")))
    return result(["aromatherapie"], "Aromathérapie explicite", [input.name]);
  if (matchTitle(titleRules("arnica", "douleurs?", "musculaire", "muscles?", "articulations?", "decontractant", "endol", "cryo", "chauffants?")))
    return result(["douleurs-muscles"], "Confort musculaire ou articulaire explicite", [input.name]);
  if (matchTitle(titleRules("protection auditive", "anti bruit", "bouchons? oreilles?", "natation adulte")))
    return result(["orl-respiration"], "Protection auditive explicite", [input.name]);

  if (size !== null && size >= 150 && matchTitle(titleRules("creme", "lait", "baume", "emulsion", "lotion")))
    return result(["soins-corps"], "Soin dermatologique grand format attribué au corps", [input.name], "MEDIUM");
  if (matchTitle(titleRules("barrier creme", "creme isolante", "creme apaisante", "fluide apaisant", "spray apaisant", "emulsion reparatrice", "creme reparatrice", "baume reparateur cutane", "soin protecteur", "soin reparateur", "soin dermo regulateur", "soin regulateur", "rugosites", "psoriasis", "oleozinc", "emulkera", "xerial", "iraltone ds", "epta ds", "senselina")))
    return result(["soins-corps"], "Soin dermatologique non spécifique", [input.name], "MEDIUM");
  if (matchTitle(titleRules("acide hyaluronique", "huile de beaute", "fluide equilibrant", "creme extra riche", "creme lissante", "creme rebondissante")))
    return result(["soins-visage"], "Soin cosmétique du visage", [input.name], "MEDIUM");

  if (matchContext(titleRules("dentaire", "bucco dentaire", "gencives", "hygiene buccale")))
    return result(["soins-dentaires"], "Contexte descriptif bucco-dentaire", [input.description || input.name], "MEDIUM");
  if (matchContext(titleRules("complement alimentaire", "supplement alimentaire")))
    return result(["sante-generale"], "Contexte descriptif de complément alimentaire", [input.description || input.name], "MEDIUM");
  if (matchContext(titleRules("visage", "peau du visage"))) {
    if (matchTitle(titleRules("hydratant", "hydratante", "hydratation", "cream", "creme")))
      return result(["hydratants-visage"], "Hydratation confirmée par le contexte visage", [input.description || input.name], "MEDIUM");
    return result(["soins-visage"], "Contexte descriptif visage", [input.description || input.name], "MEDIUM");
  }
  if (matchContext(titleRules("corps", "peau du corps")))
    return result(["soins-corps"], "Contexte descriptif corps", [input.description || input.name], "MEDIUM");

  return result([], "Aucune règle suffisamment fiable", [input.name], "REVIEW");
}

export const taxonomyBySlug = new Map(
  CATALOGUE_TAXONOMY.map((category) => [category.slug, category]),
);
