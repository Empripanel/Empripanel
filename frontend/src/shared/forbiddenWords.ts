/**
 * Lista de términos no permitidos en fichas de negocio (validación solo en cliente).
 * Orden de comprobación: frases largas primero para evitar coincidencias parciales.
 */
export const BUSINESS_FORBIDDEN_WORDS = [
  'trata de personas',
  'lavado de dinero',
  'juego ilegal',
  'juego clandestino',
  'puta madre',
  'ácido lisérgico',
  'pornografía',
  'prostitución',
  'prostituta',
  'prostituto',
  'sexualidad',
  'narcotráfico',
  'narcotrafico',
  'extorsión',
  'extorsion',
  'piratería',
  'pirateria',
  'metanfetamina',
  'marihuana',
  'heroína',
  'heroina',
  'cocaína',
  'cocaina',
  'droga',
  'drogas',
  'porro',
  'armas',
  'arma',
  'sexo',
  'sexual',
  'porno',
  'porn',
  'erótico',
  'erótica',
  'xxx',
  'escort',
  'puta',
  'puto',
  'fetiche',
  'pistola',
  'revólver',
  'revolver',
  'rifle',
  'escopeta',
  'fusil',
  'ametralladora',
  'navaja',
  'bomba',
  'explosivo',
  'munición',
  'balas',
  'falopa',
  'merca',
  'faso',
  'crack',
  'éxtasis',
  'pastilla',
  'lsd',
  'ácido',
  'sicario',
  'mafioso',
  'mafia',
  'trata',
  'fraude',
  'estafa',
  'apuestas',
  'apuesta',
];

const SORTED = [...BUSINESS_FORBIDDEN_WORDS].sort((a, b) => b.length - a.length);

const WORD_BOUNDARY_SUFFIX = '(?:$|[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])';

/** Detecta si el texto contiene algún término prohibido como palabra/frase (insensible a mayúsculas). */
export function findForbiddenWordInText(text: string | null | undefined): string | null {
  if (text == null) return null;
  const t = String(text);
  if (!t.trim()) return null;

  for (const word of SORTED) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])${escaped}${WORD_BOUNDARY_SUFFIX}`, 'i');
    if (regex.test(t)) return word;
  }
  return null;
}

export const BUSINESS_FORBIDDEN_MESSAGE = 'Este campo contiene lenguaje inapropiado';

export type ProfileFormLike = {
  publicName: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  logo: string;
  redirectionUrl: string;
  location?: string;
  publicPhone?: string;
  publicEmail?: string;
  socials: {
    website: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    tiktok: string;
    facebook: string;
    youtube: string;
  };
};

/** Devuelve errores por campo (misma clave que usa el formulario) para resaltar inputs. */
export function getProfileForbiddenFieldErrors(fd: ProfileFormLike): Record<string, string> {
  const msg = BUSINESS_FORBIDDEN_MESSAGE;
  const out: Record<string, string> = {};

  const mark = (field: string, value: string | undefined | null) => {
    if (out[field]) return;
    if (findForbiddenWordInText(value ?? '')) out[field] = msg;
  };

  mark('publicName', fd.publicName);
  mark('category', fd.category);
  mark('shortDescription', fd.shortDescription);
  mark('fullDescription', fd.fullDescription);
  mark('redirectionUrl', fd.redirectionUrl);
  mark('location', fd.location);
  mark('publicPhone', fd.publicPhone);
  mark('publicEmail', fd.publicEmail);

  if (fd.logo && !fd.logo.startsWith('data:')) {
    mark('logo', fd.logo);
  }

  mark('socialWebsite', fd.socials.website);
  mark('socialInstagram', fd.socials.instagram);
  mark('socialTiktok', fd.socials.tiktok);
  mark('socialTwitter', fd.socials.twitter);
  mark('socialLinkedin', fd.socials.linkedin);
  mark('socialFacebook', fd.socials.facebook);
  mark('socialYoutube', fd.socials.youtube);

  return out;
}
