import type { Reward } from '@/types/reward';

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'mock-welcome-drink-vinozza',
    venue_id: 'vinozza',
    name: 'Ingyen welcome drink a Vinozzában',
    description: 'Kezdd az estét egy ház welcome drinkkel. Mutasd meg a beváltási képernyőt a pultnál, és a személyzet aktiválja az ajánlatot.',
    points_required: 450,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200',
    category: 'drink',
    is_global: true,
    partner_name: 'Vinozza Wine & Aperitivo',
    priority: 100,
    terms_conditions: 'Egy felhasználó naponta egyszer válthatja be. Más kedvezménnyel nem összevonható.',
  },
  {
    id: 'mock-cocktail-night',
    venue_id: 'come-get-it-partner',
    name: '2. koktél féláron',
    description: 'Rendelj egy signature koktélt, és a második ugyanabból az italból 50% kedvezménnyel érkezik.',
    points_required: 750,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=1200',
    category: 'drink',
    is_global: true,
    partner_name: 'Come Get It partnerhelyek',
    priority: 92,
    terms_conditions: 'Csak helyben fogyasztásra. A kedvezmény a második, azonos vagy alacsonyabb árú koktélra érvényes.',
  },
  {
    id: 'mock-vip-table-upgrade',
    venue_id: 'come-get-it-vip',
    name: 'VIP asztal upgrade',
    description: 'Foglalj asztalt partnerhelyen, és pontjaidért prémium ülőhelyet vagy jobb asztalt kérhetsz elérhetőség szerint.',
    points_required: 1800,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
    category: 'vip',
    is_global: true,
    partner_name: 'Kiemelt partnerek',
    priority: 88,
    terms_conditions: 'Elérhetőség függvénye. Péntek-szombat este előzetes foglalás szükséges.',
  },
  {
    id: 'mock-dessert-gift',
    venue_id: 'come-get-it-food',
    name: 'Ajándék desszert vacsora mellé',
    description: 'Vacsorázz partner éttermünkben, és zárd az estét egy ajándék desszerttel.',
    points_required: 900,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200',
    category: 'food',
    is_global: true,
    partner_name: 'Gasztro partnerek',
    priority: 82,
    terms_conditions: 'Minimum két főétel rendelése mellett érvényes.',
  },
  {
    id: 'mock-date-night',
    venue_id: 'come-get-it-date',
    name: 'Páros aperitivo ajánlat',
    description: 'Két pohár prosecco és egy megosztható snack tál kedvezményes pontbeváltással.',
    points_required: 1250,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1200',
    category: 'experience',
    is_global: true,
    partner_name: 'Aperitivo helyek',
    priority: 78,
    terms_conditions: 'A helyszínen elérhető napi kínálat szerint.',
  },
  {
    id: 'mock-exclusive-night',
    venue_id: 'come-get-it-exclusive',
    name: 'Exkluzív este meghívó',
    description: 'Limitált Come Get It esemény belépő: DJ, welcome drink és zárt partner ajánlatok egy este alatt.',
    points_required: 2600,
    valid_until: '2026-12-31',
    active: true,
    image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200',
    category: 'experience',
    is_global: true,
    partner_name: 'Come Get It Club',
    priority: 70,
    terms_conditions: 'Limitált férőhely. A beváltás nem garantál belépést, ha az esemény megtelt.',
  },
];

export function getMockRewardById(id: string): Reward | null {
  return MOCK_REWARDS.find((reward) => reward.id === id) ?? null;
}

export function mergeWithMockRewards(rewards: Reward[] | undefined | null): Reward[] {
  const byId = new Map<string, Reward>();
  MOCK_REWARDS.forEach((reward) => byId.set(reward.id, reward));
  (rewards ?? []).forEach((reward) => {
    if (reward?.id) byId.set(reward.id, reward);
  });
  return Array.from(byId.values());
}
