/**
 * CianOS Ultra V3 - Temporal Login Streak Tracker
 * Manages calendar verification loops, gap validations, and crystal payout injections.
 */

import { StateManager } from "../state.js";
import { DateEngine } from "../utils/dateEngine.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const StreakModule = {
    /**
     * Refreshes the visual rendering of the 7-day streak matrix widget.
     * Called automatically during dashboard initialization routines.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    refreshWidget(state) {
        const container = document.getElementById("streak-matrix-target");
        if (!container) return;

        const history = state.streak.historyLog || [];
        const currentStreakCount = state.streak.currentCount;
        const matrix = DateEngine.getPastWeekMatrix();

        // Synchronize numeric counters across display text spans safely
        const counterNode = document.getElementById("streak-counter-value");
        if (counterNode) counterNode.textContent = currentStreakCount;

        container.innerHTML = matrix.map(day => {
            // Check if this normalized date exists within the player's history logs
            const isLogged = history.includes(day.dateStr);
            const isToday = day.dateStr === DateEngine.getNormalizedDateString(new Date());

            return `
                <div class="streak-day-node ${isLogged ? 'streak-active' : ''} ${isToday ? 'streak-today' : ''}">
                    <span class="day-label" style="font-size: 9px; display: block; margin-bottom: 4px; font-family: 'Orbitron', sans-serif;">
                        ${day.label}
                    </span>
                    <div class="day-status-indicator" style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; background: ${isLogged ? 'linear-gradient(135deg, #00d2ff 0%, #0066ff 100%)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${isLogged ? '#00d2ff' : 'rgba(255,255,255,0.1)'}; box-shadow: ${isLogged ? '0 0 8px rgba(0, 210, 255, 0.4)' : 'none'};">
                        <i class="fa-solid ${isLogged ? 'fa-circle-check' : 'fa-circle'}" style="font-size: 11px; color: ${isLogged ? '#fff' : 'rgba(255,255,255,0.1)'};"></i>
                    </div>
                </div>
            `;
        }).join("");

        this.bindWidgetActionTriggers(state);
    },

    /**
     * Attaches structural click listeners to manual log execution buttons.
     * @param {Object} state 
     */
    bindWidgetActionTriggers(state) {
        const checkInBtn = document.getElementById("btn-execute-checkin");
        if (!checkInBtn) return;

        const todayStr = DateEngine.getNormalizedDateString(new Date());
        const alreadyCheckedIn = state.streak.historyLog.includes(todayStr);

        if (alreadyCheckedIn) {
            checkInBtn.disabled = true;
            checkInBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> TIMESTAMP LOGGED`;
            checkInBtn.style.background = "#1e293b";
            checkInBtn.style.color = "#475569";
            checkInBtn.style.borderColor = "transparent";
        } else {
            // Clean previous event handlers to mitigate memory drifting loops
            checkInBtn.replaceWith(checkInBtn.cloneNode(true));
            const activeBtn = document.getElementById("btn-execute-checkin");
            
            activeBtn.addEventListener("click", () => this.processDailyCheckInTransaction());
        }
    },

    /**
     * Executes chronological parameter verifications and commits currency updates.
     */
    processDailyCheckInTransaction() {
        const state = StateManager.getState();
        const streakData = JSON.parse(JSON.stringify(state.streak));
        let player = JSON.parse(JSON.stringify(state.player));

        const todayStr = DateEngine.getNormalizedDateString(new Date());
        
        // Fail-safe check preventing double invocation exploits
        if (streakData.historyLog.includes(todayStr)) return;

        // Verify if the system clock detects a streak expiration window gap
        if (DateEngine.hasStreakExpired(streakData.lastActiveTimestamp)) {
            streakData.currentCount = 0;
            ToastEngine.trigger("STREAK COOLDOWN DEFILED // TIMELINE BROKEN, RESETTING TALLY", "danger");
        }

        // Increment temporal counters
        streakData.currentCount += 1;
        streakData.historyLog.push(todayStr);
        streakData.lastActiveTimestamp = new Date().toISOString();

        // Every 7 continuous days awards a premium crystallization drop bonus
        let crystalBonusAwarded = 0;
        if (streakData.currentCount % 7 === 0) {
            crystalBonusAwarded = 3;
            player.crystals += 3;
            ToastEngine.trigger("CHRONO BONUS UNLOCKED // HARVESTED +3 DIMENSIONAL CRYSTALS", "loot");
        } else {
            // Regular check-in scaling award
            player.gold += 200;
            ToastEngine.trigger("DAILY ATTENDANCE LOGGED // ALLOCATED +200 GOLD pieces", "loot");
        }

        // Commit modifications transactionally to state management modules
        StateManager.update("streak", () => streakData);
        StateManager.update("player", () => player);

        ToastEngine.trigger(`RECORDS UPDATED // SYSTEM CONTINUITY STREAK: ${streakData.currentCount} DAYS`, "system");

        // Force downstream re-render updates immediately across active dashboard views
        this.refreshWidget(StateManager.getState());
        AppCore.executeModuleRender("dashboard");
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("streak", StreakModule);
