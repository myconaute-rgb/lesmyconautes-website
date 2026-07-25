/**
 * Bloc « notre gamme » — 6 encarts, communs à l'accueil, à /pros et à /myconautes.
 *
 * Les descriptions viennent du patch DA du 25/07/2026 (docs/da/v4-2026-07-25) :
 * texte de vente grand public, volontairement plus littéraire que les `blurb`
 * de `varieties.ts`, qui restent alignés sur la table DB `public.varieties`.
 */
import type { ImageMetadata } from "astro";
import { VARIETIES } from "./varieties";
import epiceriePicklesPic from "../assets/photos/epicerie-pickles.jpg";
import substratBlocPic from "../assets/photos/substrat-bloc.jpg";

const byCode = Object.fromEntries(VARIETIES.map((v) => [v.varietyCode, v]));

export interface GammeCardData {
  title: string;
  /** Ligne script sous le titre : nom latin ou tagline. */
  sub: string;
  text: string;
  image: ImageMetadata;
  imageAlt: string;
  tone: "mauve" | "jaune" | "bleu" | "sable" | "orange" | "anis";
  badge?: string;
}

export const GAMME: GammeCardData[] = [
  {
    title: "Pleurote gris",
    sub: "Pleurotus ostreatus",
    text: "L'incontournable. Sa chair tendre, ses délicates notes de sous-bois et son incroyable polyvalence en font le compagnon idéal de toutes vos recettes. Facile à cuisiner, difficile de s'en passer !",
    image: byCode.PLEUROTE.image!,
    imageAlt: byCode.PLEUROTE.imageAlt!,
    tone: "mauve",
  },
  {
    title: "Eryngii",
    sub: "Pleurotus eryngii",
    text: "Le pleurote du Panicaut est le roi des pleurotes. Une chair ferme qui dore à merveille, une texture bluffante proche du poulet ou même de la saint-jacques et un léger goût de noisette. À poêler tout simplement ou à effilocher dans un burger végétal.",
    image: byCode.ERYNGII.image!,
    imageAlt: byCode.ERYNGII.imageAlt!,
    tone: "jaune",
  },
  {
    title: "Black Pearl",
    sub: "Pleurotus ostreatus var. black pearl",
    text: "L'élégance à l'état brut. Sa robe sombre attire le regard, sa chair dense révèle de subtiles notes fumées. Une fois grillée, elle sublime l'assiette et ravit les papilles.",
    image: byCode.BLACK_PEARL.image!,
    imageAlt: byCode.BLACK_PEARL.imageAlt!,
    tone: "bleu",
    badge: "Bientôt de retour !",
  },
  {
    title: "Hericium",
    sub: "hericium erinaceus",
    text: "Étonnant, la crinière de lion. Avec ses longs filaments blancs et sa texture évoquant le crabe ou le homard, il surprend dès la première bouchée. Son parfum délicat en fait une véritable curiosité gastronomique.",
    image: byCode.HERICIUM.image!,
    imageAlt: byCode.HERICIUM.imageAlt!,
    tone: "sable",
    badge: "Bientôt de retour !",
  },
  {
    title: "Epicerie fine",
    sub: "du local en bocal",
    text: "Le champignon autrement. Pickles d'eryngii, champignons séchés et créations de saison : des recettes artisanales fabriquées localement qui concentrent les saveurs et prolongent le plaisir bien après la récolte.",
    image: epiceriePicklesPic,
    imageAlt: "Pickles d'Eryngii — épicerie fine Les Myconautes",
    tone: "orange",
  },
  {
    title: "Substrat",
    sub: "pour cultiver chez soi",
    text: "Cultivez l'aventure. Nos substrats bio inoculés et prêts à fructifier renferment tout le potentiel du mycélium. Quelques semaines de patience… et le plaisir de voir pousser vos propres pleurotes, eryngii ou hericiums.",
    image: substratBlocPic,
    imageAlt: "Sacs de substrat inoculé prêts à fructifier — Les Myconautes",
    tone: "anis",
  },
];
