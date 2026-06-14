/**
 * CianOS Ultra V3 - Progression & Leveling Mathematics Core
 */

// Strict array matrix mapping linear progression boundaries for Rank changes
const RANK_THRESHOLDS = [
    { minLvl: 1,  rank: "RANK E", title: "MONARCH NOVICE" },
    { minLvl: 10, rank: "RANK D", title: "SHADOW WATCHER" },
    { minLvl: 20, rank: "RANK C", title: "DUNGEON CLEANSER" },
    { minLvl: 35, rank: "RANK B", title: "ELITE EXECUTIONER" },
    { minLvl: 50, rank: "RANK A", title: "SUPREME ASSASSIN" },
    { minLvl: 70, rank: "RANK S", title: "SHADOW MONARCH" }
];

export const XpEngine = {
    /**
     * Determines the exact required XP threshold ceiling for a given level using an exponential curve.
     * @param {number} level 
     * @returns {number}
     */
    calculateMaxXpForLevel(level) {
        if (level <= 1) return 100;
        // Formula matching classical solo systems: Base 100 scaled by curve modifier multiplier
        return Math.floor(100 * Math.pow(level, 1.5));
    },

    /**
     * Evaluates a current level assignment and returns structural Rank profile classifications.
     * @param {number} level 
     * @returns {{rank: string, title: string}}
     */
    evaluateRankAndTitle(level) {
        let matched = RANK_THRESHOLDS[0];
        for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
            if (level >= RANK_THRESHOLDS[i].minLvl) {
                matched = RANK_THRESHOLDS[i];
            } else {
                break;
            }
        }
        return { rank: matched.rank, title: matched.title };
    },

    /**
     * Injects XP rewards into current player profile state snapshots.
     * Evaluates and updates data metrics recursively to handle multi-level gains cleanly.
     * @param {Object} playerSnapshot - Core player object shape pulled from structural state
     * @param {number} amount - Literal XP volume added
     * @returns {{updatedPlayer: Object, levelsGained: number, statGains: Object}}
     */
    addXp(playerSnapshot, amount) {
        let p = JSON.parse(JSON.stringify(playerSnapshot)); // Safeguard reference leaks
        let levelsGained = 0;
        let accumulatedStr = 0;
        let accumulatedVit = 0;
        let accumulatedAgi = 0;
        let accumulatedInt = 0;

        p.xp += amount;

        // Process loop mapping multi-level up triggers dynamically
        while (p.xp >= p.maxXp) {
            p.xp -= p.maxXp;
            p.level += 1;
            levelsGained += 1;
            p.statPoints += 5; // Fixed operational allocation credit award

            // Continuous scale dynamic core base parameters
            accumulatedStr += 2;
            accumulatedVit += 2;
            accumulatedAgi += 1;
            accumulatedInt += 1;

            p.stats.str += 2;
            p.stats.vit += 2;
            p.stats.agi += 1;
            p.stats.int += 1;

            // Recalculate caps and ceilings for vitals based on new attribute variables
            p.maxHp = 100 + (p.stats.vit * 12);
            p.maxMp = 100 + (p.stats.int * 10);
            
            // Instantly restore bars on structural leveling milestone trigger
            p.hp = p.maxHp;
            p.mp = p.maxMp;

            // Recalculate the next ceiling
            p.maxXp = this.calculateMaxXpForLevel(p.level);
        }

        // Evaluate whether the rank has evolved based on the final structural layout
        const rankEvaluations = this.evaluateRankAndTitle(p.level);
        p.rank = rankEvaluations.rank;
        p.title = rankEvaluations.title;

        return {
            updatedPlayer: p,
            levelsGained,
            statGains: {
                str: accumulatedStr,
                vit: accumulatedVit,
                agi: accumulatedAgi,
                int: accumulatedInt
            }
        };
    },

    /**
     * Commits single-point manual modifications into a player data snapshot.
     * @param {Object} playerSnapshot 
     * @param {'str'|'vit'|'agi'|'int'} statKey 
     * @returns {Object|null} Updated player snapshot, or null if operation is invalid
     */
    allocateStatPoint(playerSnapshot, statKey) {
        if (playerSnapshot.statPoints <= 0) return null;
        if (!playerSnapshot.stats.hasOwnProperty(statKey)) return null;

        let p = JSON.parse(JSON.stringify(playerSnapshot));
        p.statPoints -= 1;
        p.stats[statKey] += 1;

        // Re-scale dynamic core dependencies instantly
        p.maxHp = 100 + (p.stats.vit * 12);
        p.maxMp = 100 + (p.stats.int * 10);

        return p;
    }
};
