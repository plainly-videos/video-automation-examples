export type Team = { name: string; logo: string };
export type Fixture = { id: string; home: Team; away: Team };

// Transparent PNG logos from ESPN's CDN, keyed by team abbreviation
const logo = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;

const teams = {
  hawks: { name: "HAWKS", logo: logo("atl") },
  celtics: { name: "CELTICS", logo: logo("bos") },
  nets: { name: "NETS", logo: logo("bkn") },
  hornets: { name: "HORNETS", logo: logo("cha") },
  bulls: { name: "BULLS", logo: logo("chi") },
  cavaliers: { name: "CAVALIERS", logo: logo("cle") },
  mavericks: { name: "MAVERICKS", logo: logo("dal") },
  nuggets: { name: "NUGGETS", logo: logo("den") },
  pistons: { name: "PISTONS", logo: logo("det") },
  warriors: { name: "WARRIORS", logo: logo("gs") },
  rockets: { name: "ROCKETS", logo: logo("hou") },
  pacers: { name: "PACERS", logo: logo("ind") },
  clippers: { name: "CLIPPERS", logo: logo("lac") },
  lakers: { name: "LAKERS", logo: logo("lal") },
  grizzlies: { name: "GRIZZLIES", logo: logo("mem") },
  heat: { name: "HEAT", logo: logo("mia") },
  bucks: { name: "BUCKS", logo: logo("mil") },
  wolves: { name: "WOLVES", logo: logo("min") },
  pelicans: { name: "PELICANS", logo: logo("no") },
  knicks: { name: "KNICKS", logo: logo("ny") },
  thunder: { name: "THUNDER", logo: logo("okc") },
  magic: { name: "MAGIC", logo: logo("orl") },
  sixers: { name: "76ERS", logo: logo("phi") },
  suns: { name: "SUNS", logo: logo("phx") },
  blazers: { name: "BLAZERS", logo: logo("por") },
  kings: { name: "KINGS", logo: logo("sac") },
  spurs: { name: "SPURS", logo: logo("sa") },
  raptors: { name: "RAPTORS", logo: logo("tor") },
  jazz: { name: "JAZZ", logo: logo("utah") },
  wizards: { name: "WIZARDS", logo: logo("wsh") },
} satisfies Record<string, Team>;

// Tonight's games: all 30 teams play, each game becomes a separate render in the batch
export const fixtures: Fixture[] = [
  { id: "nuggets-lakers", home: teams.nuggets, away: teams.lakers },
  { id: "bulls-celtics", home: teams.bulls, away: teams.celtics },
  { id: "warriors-heat", home: teams.warriors, away: teams.heat },
  { id: "clippers-knicks", home: teams.clippers, away: teams.knicks },
  { id: "suns-bucks", home: teams.suns, away: teams.bucks },
  { id: "mavericks-76ers", home: teams.mavericks, away: teams.sixers },
  { id: "hawks-nets", home: teams.hawks, away: teams.nets },
  { id: "hornets-cavaliers", home: teams.hornets, away: teams.cavaliers },
  { id: "pistons-rockets", home: teams.pistons, away: teams.rockets },
  { id: "pacers-grizzlies", home: teams.pacers, away: teams.grizzlies },
  { id: "wolves-pelicans", home: teams.wolves, away: teams.pelicans },
  { id: "thunder-magic", home: teams.thunder, away: teams.magic },
  { id: "blazers-kings", home: teams.blazers, away: teams.kings },
  { id: "spurs-raptors", home: teams.spurs, away: teams.raptors },
  { id: "jazz-wizards", home: teams.jazz, away: teams.wizards },
];
