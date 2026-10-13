export type Team = { name: string; logo: string };
export type Fixture = { id: string; home: Team; away: Team };

// Transparent PNG logos from ESPN's CDN, keyed by team abbreviation
const logo = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;

const teams = {
  nuggets: { name: "NUGGETS", logo: logo("den") },
  lakers: { name: "LAKERS", logo: logo("lal") },
  bulls: { name: "BULLS", logo: logo("chi") },
  celtics: { name: "CELTICS", logo: logo("bos") },
  warriors: { name: "WARRIORS", logo: logo("gs") },
  heat: { name: "HEAT", logo: logo("mia") },
  clippers: { name: "CLIPPERS", logo: logo("lac") },
  knicks: { name: "KNICKS", logo: logo("ny") },
  suns: { name: "SUNS", logo: logo("phx") },
  bucks: { name: "BUCKS", logo: logo("mil") },
  mavericks: { name: "MAVERICKS", logo: logo("dal") },
  sixers: { name: "76ERS", logo: logo("phi") },
} satisfies Record<string, Team>;

// Tonight's games, each one becomes a separate render in the batch
export const fixtures: Fixture[] = [
  { id: "nuggets-lakers", home: teams.nuggets, away: teams.lakers },
  { id: "bulls-celtics", home: teams.bulls, away: teams.celtics },
  { id: "warriors-heat", home: teams.warriors, away: teams.heat },
  { id: "clippers-knicks", home: teams.clippers, away: teams.knicks },
  { id: "suns-bucks", home: teams.suns, away: teams.bucks },
  { id: "mavericks-76ers", home: teams.mavericks, away: teams.sixers },
];
