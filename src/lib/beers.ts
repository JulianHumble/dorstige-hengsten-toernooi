export const BEER_TYPES = [
  'Blond',
  'Bock',
  'Dubbel',
  'Geuze / Lambiek',
  'Imperial Stout',
  'IPA',
  'Lager / Pilsner',
  'NEIPA',
  'Pale Ale',
  'Porter',
  'Saison',
  'Smoothie Ale',
  'Sour / Zuur',
  'Stout',
  'Tripel',
  'Wheat / Witbier',
] as const;

export type BeerType = typeof BEER_TYPES[number];

export interface DefaultBeer {
  order_number: number;
  brewery: string;
  beer_name: string;
  description: string;
  beer_type: BeerType;
}

export const DEFAULT_BEERS: DefaultBeer[] = [
  {
    order_number: 1,
    brewery: 'De Moersleutel',
    beer_name: 'Crank the Spring 2026',
    description: 'Seasonal lentebier, licht en bloemig met lentekriebels',
    beer_type: 'Saison',
  },
  {
    order_number: 2,
    brewery: "Brouwerij 't IJ",
    beer_name: 'Paasij',
    description: 'Seizoensbier voor Pasen, kruidig en vol van smaak',
    beer_type: 'Blond',
  },
  {
    order_number: 3,
    brewery: 'Brouwerij Kees',
    beer_name: 'Mosaic Hop',
    description: 'Hoppy American Pale Ale, fris en tropisch met Mosaic hop',
    beer_type: 'Pale Ale',
  },
  {
    order_number: 4,
    brewery: 'Pohjala',
    beer_name: 'Kosmos NEIPA',
    description: 'New England IPA, hazy en juicy met tropisch fruit',
    beer_type: 'NEIPA',
  },
  {
    order_number: 5,
    brewery: 'Arpus',
    beer_name: 'Fruitheart Smoothie Ale',
    description: 'Fruitige smoothie-stijl ale, zoet en vol met tropisch fruit en bessen',
    beer_type: 'Smoothie Ale',
  },
  {
    order_number: 6,
    brewery: 'Brouwerij Boon',
    beer_name: 'Oude Geuze Boon',
    description: 'Traditionele lambiek, zuur en complex met jaren rijping — palate cleanser voor het donkere blok',
    beer_type: 'Geuze / Lambiek',
  },
  {
    order_number: 7,
    brewery: 'Jopen',
    beer_name: 'Zwarte Ziel 2026',
    description: 'Jaarlijkse editie, donker en intens met gebrande mout',
    beer_type: 'Stout',
  },
  {
    order_number: 8,
    brewery: 'Stichting De Molen',
    beer_name: 'Oester Stout',
    description: 'Stout gebrouwen met echte oesters, ziltig en romig',
    beer_type: 'Stout',
  },
  {
    order_number: 9,
    brewery: 'De Moersleutel',
    beer_name: 'Motor Oil',
    description: 'Imperial Stout, pikzwart en olieachtig met koffie- en chocoladetoetsen — de grote finale',
    beer_type: 'Imperial Stout',
  },
];
