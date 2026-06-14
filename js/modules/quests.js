/**
 * CianOS Ultra V3 - Quests Module
 * Governs active campaigns, reward processing, and tab filtration matrices.
 */

import { StateManager } from "../state.js";
import { XpEngine } from "../utils/xpEngine.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const QuestsModule = {
    activeFilter: "daily",

    /**
     * Renders items into the DOM element container based on selected filters.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    render(state) {
        const target = document.getElementById("quest-list-target");
        if (!target) return;

        const quests = state.quests || [];
        
        // Filter out records based on structural state variables
        const filteredQuests = quests.filter(q => {
            if (this.activeFilter === "completed") {
                return q.completed === true;
            } else {
                return q.type === this.activeFilter && q.completed === false;
            }
        });

        if (filteredQuests.length === 0) {
            target.innerHTML = `
                <div style="text-align:center; padding:32px; color:#7388a1; font-family:'Orbitron', sans-serif; font-size:11px; letter-spacing:1px;">
                    <i class="fa-solid fa-circle-check" style="font-size:24px; margin-bottom:8px; display:block; color:rgba(255,255,255,0.1);"></i>
                    NO CAMPAIGNS IN THIS SECTOR
                </div>
            `;
            this.bindTabControls();
            return;
        }

        target.innerHTML = filteredQuests.map(q => `
            <div class="quest-hud-card ${q.completed ? 'quest-completed' : `rank-${q.type}`}">
                <h4>${q.title.toUpperCase()}</h4>
                <p>${q.desc}</p>
                <div class="quest-reward-row">
                    <span><i class="fa-solid fa-bolt"></i> +${q.xpReward} XP</span>
                    <span><i class="fa-solid fa-coins"></i> +${q.goldReward} GOLD</span>
                </div>
                ${!q.completed ? `
                    <button class="quest-action-trigger-btn" data-quest-id="${q.id}">
                        <i class="fa-solid fa-scroll-old"></i> CLAIM COMPLETION
                    </button>
                ` : `
                    <div style="font-family:'Orbitron', sans-serif; font-size:10px; color:#22c55e; font-weight:700;">
                        <i class="fa-solid fa-check-double"></i> ARCHIVED TO RECORD CORE
                    </div>
                `}
            </div>
        `).join("");

        this.bindTabControls();
        this.bindActionTriggers();
    },

    /**
     * Binds click handlers to categorical tab nodes to switch active filters.
     */
    bindTabControls() {
        const tabButtons = document.querySelectorAll(".quest-filter-tabs .filter-tab");
        tabButtons.forEach(btn => {
            // Remove previous instances to prevent multi-binding memory loops
            btn.replaceWith(btn.cloneNode(true));
        });

        // Re-fetch clean list after cleaning structural nodes
        const cleanButtons = document.querySelectorAll(".quest-filter-tabs .filter-tab");
        cleanButtons.forEach(btn => {
            const currentFilterAttr = btn.getAttribute("data-filter");
            
            if (currentFilterAttr === this.activeFilter) {
                btn.classList.add("active-tab");
            } else {
                btn.classList.remove("active-tab");
            }

            btn.addEventListener("click", () => {
                this.activeFilter = currentFilterAttr;
                this.render(StateManager.getState());
            });
        });
    },

    /**
     * Attaches structural click interceptors directly onto interactive completion buttons.
     */
    bindActionTriggers() {
        const actionButtons = document.querySelectorAll(".quest-action-trigger-btn");
        actionButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const questId = e.currentTarget.getAttribute("data-quest-id");
                this.resolveQuestCompletion(questId);
            });
        });
    },

    /**
     * Processes transactions for complete campaigns, issuing gold and level recalculations.
     * @param {string} questId 
     */
    resolveQuestCompletion(questId) {
        const currentState = StateManager.getState();
        const questIndex = currentState.quests.findIndex(q => q.id === questId);

        if (questIndex === -1) return;
        const targetQuest = currentState.quests[questIndex];

        // Process rewarding math modifications inside isolated functional scopes
        let playerObj = currentState.player;
        playerObj.gold += targetQuest.goldReward;
        
        // Pass player snapshot through the xp engine calculation array matrix
        const conversionResult = XpEngine.addXp(playerObj, targetQuest.xpReward);

        // Update overall counters tracking global statistics profiles
        const updatedTotalCompleted = currentState.counters.totalQuestsCompleted + 1;

        // Commit modifications transactionally back to the StateManager module
        StateManager.update("quests", (currentQuests) => {
            currentQuests[questIndex].completed = true;
            return currentQuests;
        });

        StateManager.update("counters.totalQuestsCompleted", () => updatedTotalCompleted);
        StateManager.update("player", () => conversionResult.updatedPlayer);

        // Deliver high-fidelity visual context responses via the toast array engine
        ToastEngine.trigger(`QUEST SOLVED: +${targetQuest.goldReward} GOLD`, "loot");
        ToastEngine.trigger(`GAIN: +${targetQuest.xpReward} SYSTEM XP`, "system");

        // If thresholds trigger multi-level milestone elevations, play cinematic overlays
        if (conversionResult.levelsGained > 0) {
            ToastEngine.trigger(`CRITICAL: HUNTER RANK STATUS ELEVATED`, "system");
            AppCore.triggerCinematicLevelOverlay(conversionResult.statGains, conversionResult.updatedPlayer.level);
        }

        // Force local re-render loop execution path to clear state
        this.render(StateManager.getState());
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("quests", QuestsModule);
