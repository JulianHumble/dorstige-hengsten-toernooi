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
    description: 'Geur: Bloemen, vers gemaaid gras, lichte citrus en een vleugje witte peper. Smaak: Fris en droog met tonen van kamille, citroen en een subtiele kruidigheid. Licht parelend met een droge, kruidige afdronk.',
    beer_type: 'Saison',
  },
  {
    order_number: 2,
    brewery: "Brouwerij 't IJ",
    beer_name: 'Paasij',
    description: 'Geur: Warme kruiden zoals koriander en sinaasappelschil, honingachtige zoetheid en een toets van kaneel. Smaak: Vol en rond met kruidige noten, karamel en gedroogd fruit. Licht zoet met een verwarmende, kruidige afdronk.',
    beer_type: 'Blond',
  },
  {
    order_number: 3,
    brewery: 'Brouwerij Kees',
    beer_name: 'Mosaic Hop',
    description: 'Geur: Explosie van tropisch fruit — mango, passievrucht en ananas — met een ondertoon van dennenhars. Smaak: Sappig en fris met grapefruit, lychee en een stevig maar niet opdringerig bittere bite. Droge, fruitige afdronk.',
    beer_type: 'Pale Ale',
  },
  {
    order_number: 4,
    brewery: 'Pohjala',
    beer_name: 'Kosmos NEIPA',
    description: 'Geur: Hazy en sappig — perzik, sinaasappelsap en een hint van kokos. Smaak: Zacht en romig mondgevoel met tropisch fruit, mandarijn en mango. Nauwelijks bitter, vol en juicy met een zachte afdronk.',
    beer_type: 'NEIPA',
  },
  {
    order_number: 5,
    brewery: 'Arpus',
    beer_name: 'Fruitheart Smoothie Ale',
    description: 'Geur: Rijp bessenfruit, aardbei en een yoghurtachtige zoetheid. Smaak: Dik en fluweelzacht als een fruitsmoothie. Bosbessen, framboos en passievrucht domineren. Geen bitterheid, zoet met een romige, fruitige afdronk.',
    beer_type: 'Smoothie Ale',
  },
  {
    order_number: 6,
    brewery: 'Brouwerij Boon',
    beer_name: 'Oude Geuze Boon',
    description: 'Geur: Scherp en zurig met groene appel, citroenschil en een funky, aardse ondertoon. Smaak: Droog en intens zuur met tonen van groene appel, grapefruit en een vleugje eikenhout. Complexe, langdurig zurige afdronk.',
    beer_type: 'Geuze / Lambiek',
  },
  {
    order_number: 7,
    brewery: 'Jopen',
    beer_name: 'Zwarte Ziel 2026',
    description: 'Geur: Gebrande mout, espresso, pure chocolade en een rokerig accent. Smaak: Intens donker met koffie, cacao en een lichte zoete karameltoon. Volle body met een bittere, roosterige afdronk.',
    beer_type: 'Stout',
  },
  {
    order_number: 8,
    brewery: 'Stichting De Molen',
    beer_name: 'Oester Stout',
    description: 'Geur: Zeebries en ziltige mineralen gemengd met donkere chocolade en gebrande mout. Smaak: Romig en vol met een opvallend ziltig karakter, donker brood, mokka en een subtiele umami. Droge, minerale afdronk.',
    beer_type: 'Stout',
  },
  {
    order_number: 9,
    brewery: 'De Moersleutel',
    beer_name: 'Motor Oil',
    description: 'Geur: Dikke, intense geur van verse espresso, donkere chocolade, melasse en een hint van bourbon. Smaak: Pikzwart en olieachtig met lagen van koffie, pure cacao, toffee en licht gebrande karamel. Volle, stroperige body met een lange, bitterzoete afdronk.',
    beer_type: 'Imperial Stout',
  },
];
