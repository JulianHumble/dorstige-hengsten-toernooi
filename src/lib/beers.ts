export interface DefaultBeer {
  order_number: number;
  brewery: string;
  beer_name: string;
  description: string;
}

export const DEFAULT_BEERS: DefaultBeer[] = [
  {
    order_number: 1,
    brewery: 'De Moersleutel',
    beer_name: 'Crank the Spring 2026',
    description: 'Seasonal lentebier, licht en bloemig met lentekriebels',
  },
  {
    order_number: 2,
    brewery: "Brouwerij 't IJ",
    beer_name: 'Paasij',
    description: 'Seizoensbier voor Pasen, kruidig en vol van smaak',
  },
  {
    order_number: 3,
    brewery: 'Brouwerij Kees',
    beer_name: 'Mosaic Hop',
    description: 'Hoppy American Pale Ale, fris en tropisch met Mosaic hop',
  },
  {
    order_number: 4,
    brewery: 'Pohjala',
    beer_name: 'Kosmos NEIPA',
    description: 'New England IPA, hazy en juicy met tropisch fruit',
  },
  {
    order_number: 5,
    brewery: 'Arpus',
    beer_name: 'Fruitheart Smoothie Ale',
    description: 'Fruitige smoothie-stijl ale, zoet en vol met tropisch fruit en bessen',
  },
  {
    order_number: 6,
    brewery: 'Brouwerij Boon',
    beer_name: 'Oude Geuze Boon',
    description: 'Traditionele lambiek, zuur en complex met jaren rijping — palate cleanser voor het donkere blok',
  },
  {
    order_number: 7,
    brewery: 'Jopen',
    beer_name: 'Zwarte Ziel 2026',
    description: 'Jaarlijkse editie, donker en intens met gebrande mout',
  },
  {
    order_number: 8,
    brewery: 'Stichting De Molen',
    beer_name: 'Oester Stout',
    description: 'Stout gebrouwen met echte oesters, ziltig en romig',
  },
  {
    order_number: 9,
    brewery: 'De Moersleutel',
    beer_name: 'Motor Oil',
    description: 'Imperial Stout, pikzwart en olieachtig met koffie- en chocoladetoetsen — de grote finale',
  },
];
