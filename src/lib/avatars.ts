/**
 * Mapeo de avatares con fotografías reales y de alta calidad para usuarios.
 * Proporciona un banco de 100+ rostros humanos auténticos y únicos sin repeticiones.
 */

const USER_AVATARS: Record<string, string> = {
  carlos: "/images/avatars/carlos.jpg",
  ana: "/images/avatars/ana.jpg",
  mateo: "/images/avatars/mateo.jpg",
  paula: "/images/avatars/paula.jpg",
  julian: "/images/avatars/julian.jpg",
  valentina: "/images/avatars/valentina.jpg",
  sebas: "/images/avatars/sebas.jpg",
  laura: "/images/avatars/laura.jpg",
  daniela: "/images/avatars/daniela.jpg",
  andres: "/images/avatars/andres.jpg",
  camila: "/images/avatars/camila.jpg",
};

// Colección de 100 fotografías reales distintas para usuarios dinámicos
const ALL_100_AVATARS: string[] = [
  ...Array.from({ length: 50 }, (_, i) => `/images/avatars/men_${i + 1}.jpg`),
  ...Array.from({ length: 50 }, (_, i) => `/images/avatars/women_${i + 1}.jpg`),
];

export function getUserAvatar(username?: string, explicitAvatar?: string): string {
  if (explicitAvatar && explicitAvatar.startsWith("/")) {
    return explicitAvatar;
  }
  if (!username) return "/images/avatars/men_1.jpg";
  const clean = username.toLowerCase().trim();
  if (USER_AVATARS[clean]) {
    return USER_AVATARS[clean];
  }
  // Hash determinístico sobre el conjunto de 100 fotos únicas para mantener consistencia
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ALL_100_AVATARS.length;
  return ALL_100_AVATARS[index] || "/images/avatars/men_1.jpg";
}
