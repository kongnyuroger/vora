import { City, LandmarkCategory, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedLandmark {
  name: string;
  quartier: string;
  aliases: string[];
  city: City;
  category: LandmarkCategory;
  query: string;
}

const YAOUNDE: Omit<SeedLandmark, 'city'>[] = [
  { name: 'Bastos', quartier: 'Bastos', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Bastos, Yaoundé, Cameroun' },
  { name: 'Carrefour Biyem-Assi', quartier: 'Biyem-Assi', aliases: ['Biyem-Assi'], category: LandmarkCategory.CARREFOUR, query: 'Carrefour Biyem-Assi, Yaoundé, Cameroun' },
  { name: 'Mvan', quartier: 'Mvan', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Mvan, Yaoundé, Cameroun' },
  { name: 'Nkolbisson', quartier: 'Nkolbisson', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Nkolbisson, Yaoundé, Cameroun' },
  { name: 'Mvog-Mbi', quartier: 'Mvog-Mbi', aliases: ['Mvog Mbi'], category: LandmarkCategory.QUARTIER, query: 'Mvog-Mbi, Yaoundé, Cameroun' },
  { name: 'Essos', quartier: 'Essos', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Essos, Yaoundé, Cameroun' },
  { name: 'Ngoa-Ekellé', quartier: 'Ngoa-Ekellé', aliases: ['Ngoa Ekelle'], category: LandmarkCategory.QUARTIER, query: 'Ngoa-Ekelle, Yaoundé, Cameroun' },
  { name: 'Mendong', quartier: 'Mendong', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Mendong, Yaoundé, Cameroun' },
  { name: 'Etoudi', quartier: 'Etoudi', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Etoudi, Yaoundé, Cameroun' },
  { name: 'Nsam', quartier: 'Nsam', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Nsam, Yaoundé, Cameroun' },
  { name: 'Marché Mokolo', quartier: 'Mokolo', aliases: ['Mokolo'], category: LandmarkCategory.MARKET, query: 'Marché Mokolo, Yaoundé, Cameroun' },
  { name: 'Carrefour Warda', quartier: 'Warda', aliases: ['Warda'], category: LandmarkCategory.CARREFOUR, query: 'Carrefour Warda, Yaoundé, Cameroun' },
  { name: 'Poste Centrale', quartier: 'Centre-ville', aliases: [], category: LandmarkCategory.LANDMARK, query: 'Poste Centrale, Yaoundé, Cameroun' },
  { name: 'Marché Central', quartier: 'Centre-ville', aliases: [], category: LandmarkCategory.MARKET, query: 'Marché Central, Yaoundé, Cameroun' },
  { name: 'Ngousso', quartier: 'Ngousso', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Ngousso, Yaoundé, Cameroun' },
  { name: 'Emana', quartier: 'Emana', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Emana, Yaoundé, Cameroun' },
  { name: 'Carrefour Damas', quartier: 'Damas', aliases: ['Damas', 'Rond-point Damas'], category: LandmarkCategory.CARREFOUR, query: 'Rond-point Damas, Yaoundé, Cameroun' },
  { name: 'Odza', quartier: 'Odza', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Odza, Yaoundé, Cameroun' },
  { name: 'Aéroport International de Nsimalen', quartier: 'Nsimalen', aliases: ['Nsimalen Airport', 'Yaoundé Nsimalen International Airport'], category: LandmarkCategory.LANDMARK, query: 'Aéroport International de Nsimalen, Cameroun' },
];

const DOUALA: Omit<SeedLandmark, 'city'>[] = [
  { name: 'Akwa', quartier: 'Akwa', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Akwa, Douala, Cameroun' },
  { name: 'Bonanjo', quartier: 'Bonanjo', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Bonanjo, Douala, Cameroun' },
  { name: 'Bonapriso', quartier: 'Bonapriso', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Bonapriso, Douala, Cameroun' },
  { name: 'Deido', quartier: 'Deido', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Deido, Douala, Cameroun' },
  { name: 'New Bell', quartier: 'New Bell', aliases: [], category: LandmarkCategory.QUARTIER, query: 'New Bell, Douala, Cameroun' },
  { name: 'Bonabéri', quartier: 'Bonabéri', aliases: ['Bonaberi'], category: LandmarkCategory.QUARTIER, query: 'Bonabéri, Douala, Cameroun' },
  { name: 'Makepe', quartier: 'Makepe', aliases: ['Makepé'], category: LandmarkCategory.QUARTIER, query: 'Makepe, Douala, Cameroun' },
  { name: 'Bépanda', quartier: 'Bépanda', aliases: ['Bepanda'], category: LandmarkCategory.QUARTIER, query: 'Bepanda, Douala, Cameroun' },
  { name: 'Ndokotti', quartier: 'Ndokotti', aliases: [], category: LandmarkCategory.QUARTIER, query: 'Ndokotti, Douala, Cameroun' },
  { name: 'Marché Central', quartier: 'Congo, Douala II', aliases: [], category: LandmarkCategory.MARKET, query: 'Marché Central de Douala, Cameroun' },
  { name: 'PK (Village)', quartier: 'Bonabéri', aliases: ['PK', 'PK Village'], category: LandmarkCategory.QUARTIER, query: 'PK Village, Bonaberi, Douala, Cameroun' },
  { name: 'Aéroport International de Douala', quartier: 'Douala', aliases: ['Douala International Airport'], category: LandmarkCategory.LANDMARK, query: 'Aéroport International de Douala, Cameroun' },
];

const SEED_LANDMARKS: SeedLandmark[] = [
  ...YAOUNDE.map((l) => ({ ...l, city: City.YAOUNDE })),
  ...DOUALA.map((l) => ({ ...l, city: City.DOUALA })),
];

const CITY_FALLBACK: Record<City, [number, number]> = {
  [City.YAOUNDE]: [3.848, 11.5021],
  [City.DOUALA]: [4.0511, 9.7679],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Nominatim (OpenStreetMap) — not Mapbox — because Mapbox's geocoding
 * index has essentially no data for these informal Cameroonian
 * quartiers/landmarks (every query collapses to a generic city
 * centroid), while Nominatim resolves them precisely. This still
 * satisfies §6's "never hardcode from memory" rule via a real
 * geocoding lookup; Mapbox remains the map renderer and the live
 * geocoding fallback for free-text addresses outside this seed list.
 */
async function geocode(query: string): Promise<[number, number] | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'vora-hackathon-seed/1.0 (contact: kongnyuroger711@gmail.com)' },
  });

  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string }[];
  if (results.length === 0) return null;

  return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
}

async function main() {
  console.log(`Seeding ${SEED_LANDMARKS.length} landmarks via Nominatim...`);
  await prisma.landmark.deleteMany();

  for (const seed of SEED_LANDMARKS) {
    let coords = await geocode(seed.query);

    if (!coords) {
      console.warn(`  ! no geocode result for "${seed.query}", using city fallback`);
      coords = CITY_FALLBACK[seed.city];
    }

    const [lat, lng] = coords;
    await prisma.landmark.create({
      data: {
        name: seed.name,
        aliases: seed.aliases,
        quartier: seed.quartier,
        city: seed.city,
        lat,
        lng,
        category: seed.category,
      },
    });
    console.log(`  ✓ ${seed.name} (${seed.city}) -> ${lat.toFixed(5)}, ${lng.toFixed(5)}`);

    await sleep(1100); // respect Nominatim's 1 req/sec usage policy
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
