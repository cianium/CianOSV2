/**
 * CianOS Ultra V3 - Global State Management Architecture
 * Single Source of Truth
 */

// Initial immutable fallback architecture state schema
const DEFAULT_SYSTEM_STATE = {
    player: {
        title: "MONARCH",
        rank: "RANK E",
        level: 1,
        xp: 0,
        maxXp: 100,
        hp: 100,
        maxHp: 100,
        mp: 100,
        maxMp: 100,
        gold: 500,
        crystals: 10,
        statPoints: 5,
        stats: {
            str: 10,
            vit: 10,
            agi: 10,
            int: 10
        }
    },
    streak: {
        count: 0,
        lastActiveDate: null, // ISO string
        history: []          // Array of weekday indicators or ISO strings
    },
    quests: [
        {
            id: "q-daily-1",
            type: "daily",
            title: "PREPARATION FOR THE POWER",
            desc: "Push beyond limits. Complete 100 Push-ups, 100 Sit-ups, and a 10KM Run.",
            xpReward: 30,
            goldReward: 150,
            completed: false
        },
        {
            id: "q-daily-2",
            type: "daily",
            title: "SHADOW MONARCH INTELLECT",
            desc: "Study new tactical data structures or documentation for 30 minutes.",
            xpReward: 25,
            goldReward: 100,
            completed: false
        },
        {
            id: "q-side-1",
            type: "side",
            title: "BREAK THE LIMIT CONFINES",
            desc: "Allocate a total of 15 points into any evolutionary stat profile attribute.",
            xpReward: 100,
            goldReward: 500,
            completed: false
        }
    ],
    boss: {
        active: {
            id: "b-gate-1",
            name: "KANG TAE-SHIK (ASSASSIN TYPE)",
            rank: "B-RANK GATE",
            hp: 2500,
            maxHp: 2500,
            mpRequirement: 20,
            goldReward: 1200,
            xpReward: 350
        },
        clearedCount: 0
    ],
    skills: [
        {
            id: "s-perk-1",
            name: "BLOODLUST (PASSIVE)",
            desc: "Increases structural output capability when HP drops below 40%.",
            icon: "fa-droplet",
            unlocked: true
        },
        {
            id: "s-perk-2",
            name: "STEALTH MOVEMENT",
            desc: "Conceals operational presence completely from lower level metrics.",
            icon: "fa-eye-slash",
            unlocked: false,
            costCrystals: 5
        },
        {
            id: "s-perk-3",
            name: "DOMINATOR'S TOUCH",
            desc: "Exert absolute kinetic impact force control without physical interaction.",
            icon: "fa-hand-fist",
            unlocked: false,
            costCrystals: 15
        }
    ],
    vocab: [
        {
            id: "v-1",
            word: "Arise",
            definition: "The ultimate command to extract and summon shadow minions from deceased entities.",
            timestamp: new Date().toISOString()
        }
    ],
    shop: [
        {
            id: "item-p-1",
            category: "potions",
            name: "ELIXIR OF RECOVERY",
            desc: "Fully restorable fluid compound instantly maximizing vital HP and MP gauges.",
            costGold: 200,
            icon: "fa-flask"
        },
        {
            id: "item-g-1",
            category: "gear",
            name: "KASAKA'S VENOM FANG",
            desc: "A lethal C-Rank dagger that grants immediate structural precision buffs (+5 STR).",
            costGold: 1500,
            icon: "fa-sword"
        }
    ],
    counters: {
        totalQuestsCompleted: 0,
        totalVocabMemorized: 1
    }
};

// Deep Clone helper to break reference tracking structures entirely
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Internal memory-space encapsulation tracking current reactive reference loop
let runtimeState = deepClone(DEFAULT_SYSTEM_STATE);

// Reactive subscriber array matrix targeting structural modifications
const stateListeners = [];

export const StateManager = {
    /**
     * Initializes state reference from Storage or defaults
     * @param {Object|null} loadedState 
     */
    initialize(loadedState) {
        if (loadedState && typeof loadedState === 'object') {
            // Re-map internal parameters cleanly, tracking schema changes or expansions safely
            runtimeState = Object.assign(deepClone(DEFAULT_SYSTEM_STATE), loadedState);
        } else {
            runtimeState = deepClone(DEFAULT_SYSTEM_STATE);
        }
        this.broadcast();
    },

    /**
     * Read-only export snapshot access point to prevent dirty cross-module reference mutations
     * @returns {Object}
     */
    getState() {
        return deepClone(runtimeState);
    },

    /**
     * Overwrites targeted context sections safely using atomic transactional updates
     * @param {string} path - Dot notation root or explicit structural sub-key
     * @param {Function} updateFn - Mutator transform execution function context
     */
    update(path, updateFn) {
        const keys = path.split('.');
        let currentRef = runtimeState;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!currentRef[keys[i]]) currentRef[keys[i]] = {};
            currentRef = currentRef[keys[i]];
        }

        const targetKey = keys[keys.length - 1];
        currentRef[targetKey] = updateFn(deepClone(currentRef[targetKey]));
        
        this.broadcast();
    },

    /**
     * Performs an instantaneous absolute structural sync state override
     * @param {Object} freshState 
     */
    setRawState(freshState) {
        runtimeState = deepClone(freshState);
        this.broadcast();
    },

    /**
     * Registers context updating callback actions to process live structural adjustments smoothly
     * @param {Function} callback 
     * @returns {Function} Unsubscribe hook mapping
     */
    subscribe(callback) {
        stateListeners.push(callback);
        // Instant sync injection context for newly binding listener hooks
        callback(deepClone(runtimeState));
        return () => {
            const index = stateListeners.indexOf(callback);
            if (index > -1) stateListeners.splice(index, 1);
        };
    },

    /**
     * Forces standard data evaluation broadcasts to all listening components
     */
    broadcast() {
        const structuralSnapshot = deepClone(runtimeState);
        stateListeners.forEach(listener => {
            try {
                listener(structuralSnapshot);
            } catch (err) {
                console.error("System structural error in execution chain propagation context:", err);
            }
        });
    },

    /**
     * Resets runtime data tracking matrices cleanly to core default parameters
     */
    purgeToDefaults() {
        runtimeState = deepClone(DEFAULT_SYSTEM_STATE);
        this.broadcast();
    }
};
