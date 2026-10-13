export type Team = { name: string; logo: string };
export type Fixture = { id: string; home: Team; away: Team };

const teams = {
  nuggets: {
    name: "NUGGETS",
    logo: "https://content.sportslogos.net/logos/6/229/full/8926_denver_nuggets-primary-2019.png",
  },
  lakers: {
    name: "LAKERS",
    logo: "https://content.sportslogos.net/logos/6/237/full/los_angeles_lakers_logo_primary_2024_sportslogosnet-7324.png",
  },
  bulls: {
    name: "BULLS",
    logo: "https://content.sportslogos.net/logos/6/221/full/zdrycpc7mh5teihl10gko8sgf.png",
  },
  celtics: {
    name: "CELTICS",
    logo: "https://content.sportslogos.net/logos/6/213/full/boston_celtics_logo_primary_dark_19978753.png",
  },
  warriors: {
    name: "WARRIORS",
    logo: "https://content.sportslogos.net/logos/6/235/full/3152_golden_state_warriors-primary-2020.png",
  },
  heat: {
    name: "HEAT",
    logo: "https://content.sportslogos.net/logos/6/214/full/6459_miami_heat-primary_dark-2000.png",
  },
  clippers: {
    name: "CLIPPERS",
    logo: "https://content.sportslogos.net/logos/6/236/full/los_angeles_clippers_logo_primary_2025_sportslogosnet-5542.png",
  },
} satisfies Record<string, Team>;

// Tonight's games, each one becomes a separate render in the batch
export const fixtures: Fixture[] = [
  { id: "nuggets-lakers", home: teams.nuggets, away: teams.lakers },
  { id: "bulls-celtics", home: teams.bulls, away: teams.celtics },
  { id: "warriors-heat", home: teams.warriors, away: teams.heat },
  { id: "clippers-lakers", home: teams.clippers, away: teams.lakers },
  { id: "celtics-heat", home: teams.celtics, away: teams.heat },
  { id: "nuggets-warriors", home: teams.nuggets, away: teams.warriors },
];
