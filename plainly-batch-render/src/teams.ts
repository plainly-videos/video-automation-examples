export type Conference = "west" | "east";
export type Team = { name: string; logo: string; conference: Conference };

// Transparent PNG logos from ESPN's CDN, keyed by team abbreviation
const logo = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;

export const teams = {
  // Western Conference
  mavericks: { name: "MAVERICKS", logo: logo("dal"), conference: "west" },
  nuggets: { name: "NUGGETS", logo: logo("den"), conference: "west" },
  warriors: { name: "WARRIORS", logo: logo("gs"), conference: "west" },
  rockets: { name: "ROCKETS", logo: logo("hou"), conference: "west" },
  clippers: { name: "CLIPPERS", logo: logo("lac"), conference: "west" },
  lakers: { name: "LAKERS", logo: logo("lal"), conference: "west" },
  grizzlies: { name: "GRIZZLIES", logo: logo("mem"), conference: "west" },
  wolves: { name: "WOLVES", logo: logo("min"), conference: "west" },
  pelicans: { name: "PELICANS", logo: logo("no"), conference: "west" },
  thunder: { name: "THUNDER", logo: logo("okc"), conference: "west" },
  suns: { name: "SUNS", logo: logo("phx"), conference: "west" },
  blazers: { name: "BLAZERS", logo: logo("por"), conference: "west" },
  kings: { name: "KINGS", logo: logo("sac"), conference: "west" },
  spurs: { name: "SPURS", logo: logo("sa"), conference: "west" },
  jazz: { name: "JAZZ", logo: logo("utah"), conference: "west" },
  // Eastern Conference
  hawks: { name: "HAWKS", logo: logo("atl"), conference: "east" },
  celtics: { name: "CELTICS", logo: logo("bos"), conference: "east" },
  nets: { name: "NETS", logo: logo("bkn"), conference: "east" },
  hornets: { name: "HORNETS", logo: logo("cha"), conference: "east" },
  bulls: { name: "BULLS", logo: logo("chi"), conference: "east" },
  cavaliers: { name: "CAVALIERS", logo: logo("cle"), conference: "east" },
  pistons: { name: "PISTONS", logo: logo("det"), conference: "east" },
  pacers: { name: "PACERS", logo: logo("ind"), conference: "east" },
  heat: { name: "HEAT", logo: logo("mia"), conference: "east" },
  bucks: { name: "BUCKS", logo: logo("mil"), conference: "east" },
  knicks: { name: "KNICKS", logo: logo("ny"), conference: "east" },
  magic: { name: "MAGIC", logo: logo("orl"), conference: "east" },
  sixers: { name: "76ERS", logo: logo("phi"), conference: "east" },
  raptors: { name: "RAPTORS", logo: logo("tor"), conference: "east" },
  wizards: { name: "WIZARDS", logo: logo("wsh"), conference: "east" },
} satisfies Record<string, Team>;

export type TeamId = keyof typeof teams;

export const teamIds = Object.keys(teams) as TeamId[];

export const isTeamId = (id: unknown): id is TeamId =>
  typeof id === "string" && Object.hasOwn(teams, id);
