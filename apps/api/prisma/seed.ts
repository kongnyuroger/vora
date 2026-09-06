import {
  City,
  LandmarkCategory,
  PrismaClient,
  Role,
  RideType,
  VerificationStatus,
} from '@prisma/client';

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
  {
    name: 'Bastos',
    quartier: 'Bastos',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Bastos, Yaoundé, Cameroun',
  },
  {
    name: 'Carrefour Biyem-Assi',
    quartier: 'Biyem-Assi',
    aliases: ['Biyem-Assi'],
    category: LandmarkCategory.CARREFOUR,
    query: 'Carrefour Biyem-Assi, Yaoundé, Cameroun',
  },
  {
    name: 'Mvan',
    quartier: 'Mvan',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Mvan, Yaoundé, Cameroun',
  },
  {
    name: 'Nkolbisson',
    quartier: 'Nkolbisson',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Nkolbisson, Yaoundé, Cameroun',
  },
  {
    name: 'Mvog-Mbi',
    quartier: 'Mvog-Mbi',
    aliases: ['Mvog Mbi'],
    category: LandmarkCategory.QUARTIER,
    query: 'Mvog-Mbi, Yaoundé, Cameroun',
  },
  {
    name: 'Essos',
    quartier: 'Essos',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Essos, Yaoundé, Cameroun',
  },
  {
    name: 'Ngoa-Ekellé',
    quartier: 'Ngoa-Ekellé',
    aliases: ['Ngoa Ekelle'],
    category: LandmarkCategory.QUARTIER,
    query: 'Ngoa-Ekelle, Yaoundé, Cameroun',
  },
  {
    name: 'Mendong',
    quartier: 'Mendong',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Mendong, Yaoundé, Cameroun',
  },
  {
    name: 'Etoudi',
    quartier: 'Etoudi',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Etoudi, Yaoundé, Cameroun',
  },
  {
    name: 'Nsam',
    quartier: 'Nsam',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Nsam, Yaoundé, Cameroun',
  },
  {
    name: 'Marché Mokolo',
    quartier: 'Mokolo',
    aliases: ['Mokolo'],
    category: LandmarkCategory.MARKET,
    query: 'Marché Mokolo, Yaoundé, Cameroun',
  },
  {
    name: 'Carrefour Warda',
    quartier: 'Warda',
    aliases: ['Warda'],
    category: LandmarkCategory.CARREFOUR,
    query: 'Carrefour Warda, Yaoundé, Cameroun',
  },
  {
    name: 'Poste Centrale',
    quartier: 'Centre-ville',
    aliases: [],
    category: LandmarkCategory.LANDMARK,
    query: 'Poste Centrale, Yaoundé, Cameroun',
  },
  {
    name: 'Marché Central',
    quartier: 'Centre-ville',
    aliases: [],
    category: LandmarkCategory.MARKET,
    query: 'Marché Central, Yaoundé, Cameroun',
  },
  {
    name: 'Ngousso',
    quartier: 'Ngousso',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Ngousso, Yaoundé, Cameroun',
  },
  {
    name: 'Emana',
    quartier: 'Emana',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Emana, Yaoundé, Cameroun',
  },
  {
    name: 'Carrefour Damas',
    quartier: 'Damas',
    aliases: ['Damas', 'Rond-point Damas'],
    category: LandmarkCategory.CARREFOUR,
    query: 'Rond-point Damas, Yaoundé, Cameroun',
  },
  {
    name: 'Odza',
    quartier: 'Odza',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Odza, Yaoundé, Cameroun',
  },
  {
    name: 'Aéroport International de Nsimalen',
    quartier: 'Nsimalen',
    aliases: ['Nsimalen Airport', 'Yaoundé Nsimalen International Airport'],
    category: LandmarkCategory.LANDMARK,
    query: 'Aéroport International de Nsimalen, Cameroun',
  },
];

const DOUALA: Omit<SeedLandmark, 'city'>[] = [
  {
    name: 'Akwa',
    quartier: 'Akwa',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Akwa, Douala, Cameroun',
  },
  {
    name: 'Bonanjo',
    quartier: 'Bonanjo',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Bonanjo, Douala, Cameroun',
  },
  {
    name: 'Bonapriso',
    quartier: 'Bonapriso',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Bonapriso, Douala, Cameroun',
  },
  {
    name: 'Deido',
    quartier: 'Deido',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Deido, Douala, Cameroun',
  },
  {
    name: 'New Bell',
    quartier: 'New Bell',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'New Bell, Douala, Cameroun',
  },
  {
    name: 'Bonabéri',
    quartier: 'Bonabéri',
    aliases: ['Bonaberi'],
    category: LandmarkCategory.QUARTIER,
    query: 'Bonabéri, Douala, Cameroun',
  },
  {
    name: 'Makepe',
    quartier: 'Makepe',
    aliases: ['Makepé'],
    category: LandmarkCategory.QUARTIER,
    query: 'Makepe, Douala, Cameroun',
  },
  {
    name: 'Bépanda',
    quartier: 'Bépanda',
    aliases: ['Bepanda'],
    category: LandmarkCategory.QUARTIER,
    query: 'Bepanda, Douala, Cameroun',
  },
  {
    name: 'Ndokotti',
    quartier: 'Ndokotti',
    aliases: [],
    category: LandmarkCategory.QUARTIER,
    query: 'Ndokotti, Douala, Cameroun',
  },
  {
    name: 'Marché Central',
    quartier: 'Congo, Douala II',
    aliases: [],
    category: LandmarkCategory.MARKET,
    query: 'Marché Central de Douala, Cameroun',
  },
  {
    name: 'PK (Village)',
    quartier: 'Bonabéri',
    aliases: ['PK', 'PK Village'],
    category: LandmarkCategory.QUARTIER,
    query: 'PK Village, Bonaberi, Douala, Cameroun',
  },
  {
    name: 'Aéroport International de Douala',
    quartier: 'Douala',
    aliases: ['Douala International Airport'],
    category: LandmarkCategory.LANDMARK,
    query: 'Aéroport International de Douala, Cameroun',
  },
];

const SEED_LANDMARKS: SeedLandmark[] = [
  ...YAOUNDE.map((l) => ({ ...l, city: City.YAOUNDE })),
  ...DOUALA.map((l) => ({ ...l, city: City.DOUALA })),
];

const CITY_FALLBACK: Record<City, [number, number]> = {
  [City.YAOUNDE]: [3.848, 11.5021],
  [City.DOUALA]: [4.0511, 9.7679],
};

/**
 * Demo drivers parked around Carrefour Warda so the map has life on first
 * load instead of an empty city (§9). They are marked online but have no
 * socket, and dispatch only ever offers a ride to a driver with a live
 * connection — so these can never swallow a real request.
 *
 * The +23760… prefix is not a real Cameroonian mobile range, which keeps
 * them from ever colliding with a phone somebody actually logs in with.
 */
const WARDA: [number, number] = [3.8698, 11.5155];

interface DemoDriver {
  phone: string;
  name: string;
  vehicleModel: string;
  color: string;
  rideTypes: RideType[];
  /** Degrees of lat/lng from Warda, so the pins spread out around the carrefour. */
  offset: [number, number];
  rating: number;
  ratingCount: number;
}

const DEMO_DRIVERS: DemoDriver[] = [
  {
    phone: '+237600000001',
    name: 'Ernest Bikoi',
    vehicleModel: 'Yamaha Crux',
    color: 'Rouge',
    rideTypes: [RideType.MOTO],
    offset: [0.0031, -0.0024],
    rating: 4.9,
    ratingCount: 214,
  },
  {
    phone: '+237600000002',
    name: 'Aïcha Ngo Bell',
    vehicleModel: 'Toyota Corolla',
    color: 'Jaune',
    rideTypes: [RideType.TAXI, RideType.SHARED],
    offset: [-0.0042, 0.0019],
    rating: 4.7,
    ratingCount: 158,
  },
  {
    phone: '+237600000003',
    name: 'Blaise Ateba',
    vehicleModel: 'Sanili 125',
    color: 'Noir',
    rideTypes: [RideType.MOTO],
    offset: [0.0018, 0.0044],
    rating: 4.8,
    ratingCount: 302,
  },
  {
    phone: '+237600000004',
    name: 'Delphine Mbarga',
    vehicleModel: 'Toyota Yaris',
    color: 'Jaune',
    rideTypes: [RideType.TAXI, RideType.SHARED],
    offset: [-0.0027, -0.0038],
    rating: 4.6,
    ratingCount: 96,
  },
  {
    phone: '+237600000005',
    name: 'Serge Kamdem',
    vehicleModel: 'Nissan Almera',
    color: 'Gris',
    rideTypes: [RideType.TAXI, RideType.COMFORT],
    offset: [0.0049, 0.0011],
    rating: 5.0,
    ratingCount: 41,
  },
  {
    phone: '+237600000006',
    name: 'Patrick Owona',
    vehicleModel: 'Yamaha DT125',
    color: 'Bleu',
    rideTypes: [RideType.MOTO],
    offset: [-0.0015, 0.0029],
    rating: 4.5,
    ratingCount: 187,
  },
];

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
    headers: {
      'User-Agent':
        'vora-hackathon-seed/1.0 (contact: kongnyuroger711@gmail.com)',
    },
  });

  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string }[];
  if (results.length === 0) return null;

  return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
}

async function seedDemoDrivers() {
  console.log(
    `Seeding ${DEMO_DRIVERS.length} demo drivers near Carrefour Warda...`,
  );

  for (let i = 0; i < DEMO_DRIVERS.length; i++) {
    const d = DEMO_DRIVERS[i];
    const lat = WARDA[0] + d.offset[0];
    const lng = WARDA[1] + d.offset[1];
    const plateNumber = `CE ${420 + i * 37} ${String.fromCharCode(65 + i)}${String.fromCharCode(78 - i)}`;

    const user = await prisma.user.upsert({
      where: { phone: d.phone },
      update: { name: d.name, role: Role.DRIVER },
      create: { phone: d.phone, name: d.name, role: Role.DRIVER },
    });

    const profile = {
      rideTypes: d.rideTypes,
      plateNumber,
      vehicleModel: d.vehicleModel,
      color: d.color,
      verification: VerificationStatus.VERIFIED,
      helmetProvided: d.rideTypes.includes(RideType.MOTO),
      ratingAvg: d.rating,
      ratingCount: d.ratingCount,
      isOnline: true,
      currentLat: lat,
      currentLng: lng,
    };

    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: profile,
      create: { userId: user.id, ...profile },
    });

    console.log(`  ✓ ${d.name} — ${d.vehicleModel} (${plateNumber})`);
  }
}

async function main() {
  console.log(`Seeding ${SEED_LANDMARKS.length} landmarks via Nominatim...`);
  await prisma.landmark.deleteMany();

  for (const seed of SEED_LANDMARKS) {
    let coords = await geocode(seed.query);

    if (!coords) {
      console.warn(
        `  ! no geocode result for "${seed.query}", using city fallback`,
      );
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
    console.log(
      `  ✓ ${seed.name} (${seed.city}) -> ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    );

    await sleep(1100); // respect Nominatim's 1 req/sec usage policy
  }

  await seedDemoDrivers();

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
