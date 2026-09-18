// Configuration file for easy season updates
// Edit this file to update team data, prizes, and payment information

export const leagueConfig = {
  // Prize structure
  buyIn: 186,
  firstPlace: 952,
  secondPlace: 290,
  regularSeasonChamp: 185,
  oroy: 65,
  highScoringNonQB: 65,
  highScoringQB: 65,
  weeklyHigh: 17,

  // Payment information
  venmoUsername: 'TylerMurray',
  venmoUrl: 'https://venmo.com/TylerMurray',
  
  // Season year (for display)
  season: '2026',

  // Sleeper league — standings, records, points and weekly highs come from
  // the public API. 'owners' maps each Sleeper display name to the owner
  // name used in teamsData / paidOwners / sentOwners below.
  sleeper: {
    leagueId: '1327677681654824960',
    owners: {
      murrmanty: 'Tyler M',
      TeamJokic: 'Collin',
      PartyArty: 'Art',
      ChocolateEclair: 'Rich',
      tziskin: 'Tyler Z',
      FloorBangers: 'Renaldo',
      ElOso83: 'Jon',
      PDickson: 'Pat',
      BrettBrown: 'Brett',
      RyanKoenigsberg: 'Ryan',
    },
  },

  // Fallbacks when Sleeper is unreachable (the API normally supplies these)
  // Last completed NFL week — later weeks show greyed out on the weekly-high grid
  currentWeek: 1,

  // League shape
  weeks: 14,        // regular-season weeks that pay a weekly high
  playoffSpots: 6,  // teams above the playoff line
};

// Team data - update this for each new season
// 2026: team names carried over from 2025 as placeholders — replace with this year's names
export const teamsData = [
  {
    name: 'Nabers Know My Name',
    owner: 'Ryan',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'FloorBangers',
    owner: 'Renaldo',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: "Jag'n Off",
    owner: 'Tyler M',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'ChocolateEclair',
    owner: 'Rich',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'Jokic',
    owner: 'Collin',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'PDickson',
    owner: 'Pat',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'Herbert, Henry & Assoc.',
    owner: 'Jon',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'The Life of a Throwboy',
    owner: 'Brett',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'Tua Girls One Darty Cup',
    owner: 'Art',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  },
  {
    name: 'Chappelle Moan',
    owner: 'Tyler Z',
    pf: '0',
    pa: '0',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: []
  }
];

// Award winners - update these each season
export const awardWinners = {
  oroy: '',
  highScoringNonQB: '',
  highScoringQB: ''
};

// Owners who have paid - update as payments come in
export const paidOwners = [];

// Owners who have sent money (for positive balances) - update as payments are sent
export const sentOwners = [];