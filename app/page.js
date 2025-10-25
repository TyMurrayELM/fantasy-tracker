'use client';

import { useState } from 'react';
import { leagueConfig, teamsData, awardWinners, paidOwners, sentOwners } from './config';

const TeamRow = ({ 
  team, 
  owner, 
  position, 
  pf, 
  pa, 
  isSeasonChamp, 
  isROY, 
  isHighScoringNonQB, 
  isHighScoringQB, 
  highWeeks,
  isPaid,
  isFirstPlace,
  isSecondPlace
}) => {
  const weeklyHighPoints = highWeeks.length;
  
  // Determine background color based on position (gradient from green to red)
  const getBackgroundColor = () => {
    if (position === 1) return 'bg-green-100';
    if (position === 2) return 'bg-green-50';
    if (position === 3) return 'bg-lime-50';
    if (position === 4) return 'bg-yellow-50';
    if (position === 5) return 'bg-yellow-100';
    if (position === 6) return 'bg-yellow-100';
    if (position === 7) return 'bg-orange-50';
    if (position === 8) return 'bg-orange-100';
    if (position === 9) return 'bg-red-50';
    if (position === 10) return 'bg-red-100';
    return 'bg-gray-50';
  };
  
  const calculateWinnings = () => {
    let total = -leagueConfig.buyIn;
    if (isFirstPlace) total += leagueConfig.firstPlace;
    if (isSecondPlace) total += leagueConfig.secondPlace;
    if (isSeasonChamp) total += leagueConfig.regularSeasonChamp;
    if (isROY) total += leagueConfig.oroy;
    if (isHighScoringNonQB) total += leagueConfig.highScoringNonQB;
    if (isHighScoringQB) total += leagueConfig.highScoringQB;
    total += weeklyHighPoints * leagueConfig.weeklyHigh;
    return total;
  };

  const isSent = sentOwners.includes(owner);

  return (
    <div className={`p-3 sm:p-4 ${getBackgroundColor()} rounded-lg mb-3 sm:mb-4`}>
      {/* Team Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-2">
        <h3 className="text-base sm:text-lg font-medium">
          {position}. {team} <br />
          <span className="text-gray-600 text-xs sm:text-sm">({owner})</span>
        </h3>
        <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-0">
          <div className={`text-lg sm:text-lg font-bold ${calculateWinnings() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateWinnings())}
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full inline-block sm:mt-1 ${
            calculateWinnings() >= 0 
              ? (isSent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
              : (isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
          }`}>
            {calculateWinnings() >= 0 ? (isSent ? 'Sent' : 'Not Sent') : (isPaid ? 'Paid' : 'Not Paid')}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-xs sm:text-sm mb-3 sm:mb-4">
        PF: {parseInt(pf).toLocaleString()} | PA: {parseInt(pa).toLocaleString()}
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 sm:mb-4">
        <div>
          <input type="checkbox" checked={isSeasonChamp} readOnly className="mr-2" />
          <span className="text-sm">Reg Szn Champ</span>
        </div>
        <div>
          <input type="checkbox" checked={isROY} readOnly className="mr-2" />
          <span className="text-sm">OROY</span>
          {isROY && <div className="text-xs text-gray-500 ml-4">{awardWinners.oroy}</div>}
        </div>
        <div>
          <input type="checkbox" checked={isHighScoringNonQB} readOnly className="mr-2" />
          <span className="text-sm">High Non-QB</span>
          {isHighScoringNonQB && <div className="text-xs text-gray-500 ml-4">{awardWinners.highScoringNonQB}</div>}
        </div>
        <div>
          <input type="checkbox" checked={isHighScoringQB} readOnly className="mr-2" />
          <span className="text-sm">High QB</span>
          {isHighScoringQB && <div className="text-xs text-gray-500 ml-4">{awardWinners.highScoringQB}</div>}
        </div>
      </div>

      {/* Weekly Highs */}
      <div className="mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm font-medium mb-2">
          Weekly High Points: {weeklyHighPoints} × ${leagueConfig.weeklyHigh} = ${weeklyHighPoints * leagueConfig.weeklyHigh}
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-7 gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(week => (
            <div key={week} className="flex items-center justify-center sm:justify-start">
              <input 
                type="checkbox" 
                checked={highWeeks.includes(week)} 
                readOnly 
                className="mr-0.5 sm:mr-1 w-3 h-3 sm:w-4 sm:h-4" 
              />
              <span className="text-[10px] sm:text-xs">W{week}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation */}
      <div className="text-[10px] sm:text-xs text-gray-500 border-t border-gray-200 pt-2">
        <div>-${leagueConfig.buyIn} (buy-in)</div>
        {isFirstPlace && <div>+${leagueConfig.firstPlace} (1st)</div>}
        {isSecondPlace && <div>+${leagueConfig.secondPlace} (2nd)</div>}
        {isSeasonChamp && <div>+${leagueConfig.regularSeasonChamp} (Reg Szn Champ)</div>}
        {isROY && <div>+${leagueConfig.oroy} (OROY)</div>}
        {isHighScoringNonQB && <div>+${leagueConfig.highScoringNonQB} (High Non-QB)</div>}
        {isHighScoringQB && <div>+${leagueConfig.highScoringQB} (High QB)</div>}
        {weeklyHighPoints > 0 && <div>+${weeklyHighPoints * leagueConfig.weeklyHigh} ({weeklyHighPoints} weekly highs)</div>}
      </div>
    </div>
  );
};

const PayoutStructure = () => {
  const totalPrizePool = leagueConfig.buyIn * 10; // Assuming 10 teams
  const totalPayouts = 
    leagueConfig.firstPlace + 
    leagueConfig.secondPlace + 
    leagueConfig.regularSeasonChamp + 
    leagueConfig.oroy + 
    leagueConfig.highScoringNonQB + 
    leagueConfig.highScoringQB + 
    (leagueConfig.weeklyHigh * 14); // 14 weeks

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-blue-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Total Prize Pool</h2>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrizePool)}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">Based on ${leagueConfig.buyIn} × 10 teams</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Playoff Prizes */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4 pb-2 border-b-2 border-blue-200">
            Playoff Prizes
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-yellow-50 rounded">
              <span className="font-semibold text-base sm:text-lg">🥇 1st Place</span>
              <span className="text-xl sm:text-2xl font-bold text-green-600">
                ${leagueConfig.firstPlace}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
              <span className="font-semibold text-base sm:text-lg">🥈 2nd Place</span>
              <span className="text-xl sm:text-2xl font-bold text-green-600">
                ${leagueConfig.secondPlace}
              </span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs sm:text-sm font-medium">
              <span>Subtotal:</span>
              <span className="text-blue-600">
                ${leagueConfig.firstPlace + leagueConfig.secondPlace}
              </span>
            </div>
          </div>
        </div>

        {/* Season Awards */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-green-900 mb-3 sm:mb-4 pb-2 border-b-2 border-green-200">
            Season Awards
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded">
              <span className="font-semibold text-sm sm:text-base">🏆 Regular Season Champ</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                ${leagueConfig.regularSeasonChamp}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
              <span className="font-semibold text-sm sm:text-base">⭐ OROY</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                ${leagueConfig.oroy}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
              <span className="font-semibold text-sm sm:text-base">💪 High Scoring Non-QB</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                ${leagueConfig.highScoringNonQB}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
              <span className="font-semibold text-sm sm:text-base">🎯 High Scoring QB</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                ${leagueConfig.highScoringQB}
              </span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs sm:text-sm font-medium">
              <span>Subtotal:</span>
              <span className="text-green-600">
                ${leagueConfig.regularSeasonChamp + leagueConfig.oroy + leagueConfig.highScoringNonQB + leagueConfig.highScoringQB}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly High Points */}
      <div className="bg-white border-2 border-purple-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-purple-900 mb-3 sm:mb-4 pb-2 border-b-2 border-purple-200">
          Weekly Prizes
        </h3>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 bg-purple-50 rounded-lg">
          <div>
            <div className="font-semibold text-base sm:text-lg">📊 Weekly High Points</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">14 weeks × ${leagueConfig.weeklyHigh} per week</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              ${leagueConfig.weeklyHigh * 14}
            </div>
            <div className="text-xs text-gray-500">(${leagueConfig.weeklyHigh}/week)</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Payout Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-blue-400">
            <span className="text-sm sm:text-base">Total Prize Pool:</span>
            <span className="font-bold text-lg sm:text-xl">${totalPrizePool}</span>
          </div>
          <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-blue-400">
            <span className="text-sm sm:text-base">Total Distributed:</span>
            <span className="font-bold text-lg sm:text-xl">${totalPayouts}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-sm sm:text-base">Remaining in Vault:</span>
            <span className={`font-bold text-xl sm:text-2xl ${totalPrizePool - totalPayouts === 0 ? 'text-green-300' : 'text-yellow-300'}`}>
              ${totalPrizePool - totalPayouts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [teams] = useState(teamsData);
  const [activeTab, setActiveTab] = useState('standings');
  const totalBuyIn = leagueConfig.buyIn * teams.length;

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      <div className="bg-blue-900 p-4 sm:p-6 rounded-t-lg shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dynasty Fantasy Football Dues Tracker</h1>
        <p className="text-blue-100 text-xs sm:text-sm mt-1">Season {leagueConfig.season}</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-blue-800 flex shadow-md mt-1 rounded-b-lg overflow-hidden">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'standings'
              ? 'bg-blue-50 text-blue-900'
              : 'text-blue-100 hover:bg-blue-700'
          }`}
        >
          Standings & Dues
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'payouts'
              ? 'bg-blue-50 text-blue-900'
              : 'text-blue-100 hover:bg-blue-700'
          }`}
        >
          Payout Structure
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'standings' && (
          <>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <img 
                src="https://cdn.glitch.global/6efbe97c-0128-473f-9072-368aef793178/venmo.png?v=1736092552830" 
                alt="Venmo"
                className="h-4 sm:h-5 w-auto"
              />
              <p className="text-xs sm:text-sm">
                Payment Instructions: If you owe, please send payment via <span className="font-medium">Venmo</span> to{' '}
                <a 
                  href={leagueConfig.venmoUrl}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  @{leagueConfig.venmoUsername}
                </a>
                . Use "For Trip" or similar vague description.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <div className="text-base sm:text-lg font-bold">
              League Buy-in Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBuyIn)}
              <span className="text-sm sm:text-base font-normal text-gray-600 ml-2">(${leagueConfig.buyIn}/team)</span>
            </div>
          </div>

          {teams.map((team, index) => (
            <TeamRow
              key={index}
              position={index + 1}
              team={team.name}
              owner={team.owner}
              pf={team.pf}
              pa={team.pa}
              isSeasonChamp={team.isSeasonChamp}
              isROY={team.isROY}
              isHighScoringNonQB={team.isHighScoringNonQB}
              isHighScoringQB={team.isHighScoringQB}
              highWeeks={team.highWeeks}
              isPaid={paidOwners.includes(team.owner)}
              isFirstPlace={team.isFirstPlace}
              isSecondPlace={team.isSecondPlace}
            />
          ))}

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mt-4 sm:mt-6 mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <span className="text-sm sm:text-base font-medium">League Total Vault Balance:</span>
              <span className="text-base sm:text-lg font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                }).format(0.00)}
              </span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'payouts' && <PayoutStructure />}
      </div>
    </div>
  );
}