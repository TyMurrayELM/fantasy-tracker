// Configuration file for easy season updates
// Edit this file to update team data, prizes, and payment information

export const leagueConfig = {
  // Prize structure
  buyIn: 169,
  firstPlace: 865,
  secondPlace: 265,
  regularSeasonChamp: 170,
  oroy: 60,
  highScoringNonQB: 60,
  highScoringQB: 60,
  weeklyHigh: 15,

  // Payment information
  venmoUsername: 'TylerMurray',
  venmoUrl: 'https://venmo.com/TylerMurray',
  
  // Season year (for display)
  season: '2025',
};

// Team data - update this for each new season
export const teamsData = [
  {
    name: 'FloorBangers',
    owner: 'Renaldo',
    pf: '1228.72',
    pa: '983.96',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [2, 5]  // Weeks with high points
  },
  {
    name: 'PDickson',
    owner: 'Pat',
    pf: '1151.6',
    pa: '926.62',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [6]
  },
  {
    name: 'Nabers Know My Name',
    owner: 'Ryan',
    pf: '1079.02',
    pa: '1058.58',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [1]
  },
  {
    name: "Jag'n Off",
    owner: 'Tyler M',
    pf: '1132.74',
    pa: '1199.12',
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
    pf: '1102.36',
    pa: '1148.48',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [7]
  },
  {
    name: 'ChocolateEclair',
    owner: 'Rich',
    pf: '1066.12',
    pa: '1161.14',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [3]
  },
  {
    name: 'The Life of a Throwboy',
    owner: 'Brett',
    pf: '1047.14',
    pa: '1084.7',
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
    pf: '893.44',
    pa: '1011.72',
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
    pf: '1063.78',
    pa: '1163.02',
    isSeasonChamp: false,
    isFirstPlace: false,
    isSecondPlace: false,
    isROY: false,
    isHighScoringNonQB: false,
    isHighScoringQB: false,
    highWeeks: [4]
  },
  {
    name: 'Tua Girls One Darty Cup',
    owner: 'Art',
    pf: '984.14',
    pa: '1112.7',
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