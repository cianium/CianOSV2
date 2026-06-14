/**
 * CianOS Ultra V3 - System Bootstrapper & Main Loop Orchestrator
 */

import { StateManager } from "./state.js";
import { StorageManager } from "./utils/storage.js";
import { ToastEngine } from "./utils/toast.js";
import { XpEngine } from "./utils/xpEngine.js";
import { Router } from "./router.js";

// Lazy-loaded visual modules (initialized sequentially in future pipeline phases)
let QuestsModule = null;
let BossesModule = null;
let SkillsModule = null;
let VocabModule = null;
let EconomyModule = null;
let StreakModule = null;

export const AppCore = {
    /**
     * Entry-point initializer execution routine.
     */
    async init() {
        console.log("SYS-INIT // Awakening System Core Blueprint...");

        // Step 1: Hydrate State Manager memory cache directly from disk storage
        const structuralBackup = StorageManager.loadState();
        StateManager.initialize(structuralBackup);

        // Step 2: Establish write-lock operational disk persistence loops
        StateManager.subscribe((updatedSnapshot) => {
            StorageManager.saveState(updatedSnapshot);
            this.synchronizeGlobalHudBars(updatedSnapshot);
        });

        // Step 3: Register centralized click interactions on global HUD panels
        this.bindGlobalCoreDomListeners();

        // Step 4: Boot single-page application routing engine
        Router.init({
            dashboard: () => this.executeModuleRender("dashboard"),
            quests:    () => this.executeModuleRender("quests"),
            boss:      () => this.executeModuleRender("boss"),
            skills:    () => this.executeModuleRender("skills"),
            vocab:     () => this.executeModuleRender("vocab"),
            shop:      () => this.executeModuleRender("shop"),
            profile:   () => this.executeModuleRender("profile")
        });

        ToastEngine.trigger("SYSTEM AWAKENED // WELCOME BACK HUNTER", "system", 4000);
    },

    /**
     * Intercepts and assigns event actions across global UI wrapper frameworks.
     */
    bindGlobalCoreDomListeners() {
        // Core stat reallocation event interception tracking
        document.querySelectorAll(".stat-up-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const targetedStatKey = e.currentTarget.getAttribute("data-stat-target");
                this.handleManualAttributeAllocation(targetedStatKey);
            });
        });

        // Level-up modal acknowledgement button routing
        const closeLvlModalBtn = document.getElementById("btn-close-lvl-modal");
        if (closeLvlModalBtn) {
            closeLvlModalBtn.addEventListener("click", () => {
                document.getElementById("modal-level-up-cinematic").classList.add("system-hidden");
            });
        }

        // Direct currency-to-shop transition routing trigger
        const goldPillBtn = document.getElementById("action-trigger-gold-shop");
        if (goldPillBtn) {
            goldPillBtn.addEventListener("click", () => {
                Router.navigateTo("shop");
            });
        }
    },

    /**
     * Forces immediate UI updates across global header, currency, and XP tracking components.
     * @param {Object} state 
     */
    synchronizeGlobalHudBars(state) {
        const p = state.player;

        // Apply textual parameter modifications across text spans safely
        document.getElementById("hud-player-title").textContent = p.title.toUpperCase();
        document.getElementById("hud-player-rank").textContent = p.rank.toUpperCase();
        document.getElementById("hud-currency-gold").textContent = p.gold.toLocaleString();
        document.getElementById("hud-currency-crystals").textContent = p.crystals.toLocaleString();
        document.getElementById("hud-level-display").textContent = String(p.level).padStart(2, '0');
        
        document.getElementById("hud-xp-string").textContent = `${p.xp.toLocaleString()} / ${p.maxXp.toLocaleString()} XP`;
        
        // Calculate and clamp progression meter scaling width
        const xpPercentage = Math.min(100, Math.floor((p.xp / p.maxXp) * 100));
        document.getElementById("hud-xp-percentage").textContent = `${xpPercentage}%`;
        document.getElementById("hud-xp-fill").style.width = `${xpPercentage}%`;
    },

    /**
     * Executes manual stat reallocation and triggers an analytical state mutation update.
     * @param {'str'|'vit'|'agi'|'int'} statKey 
     */
    handleManualAttributeAllocation(statKey) {
        const currentState = StateManager.getState();
        const updatedPlayerPayload = XpEngine.allocateStatPoint(currentState.player, statKey);

        if (!updatedPlayerPayload) {
            ToastEngine.trigger("ALLOCATION ABORTED // NO AVAILABLE ABILITY POINTS", "danger");
            return;
        }

        StateManager.update("player", () => updatedPlayerPayload);
        ToastEngine.trigger(`STAT EVOLVED // ${statKey.toUpperCase()} INCREASED`, "system");
    },

    /**
     * Synchronizes asynchronous runtime registrations to dynamically execute module-specific rendering routines.
     * @param {string} viewKey 
     */
    async executeModuleRender(viewKey) {
        const freshStateSnapshot = StateManager.getState();

        // Handle structural view dashboard widget refreshes inline
        if (viewKey === "dashboard") {
            this.refreshDashboardViewVitals(freshStateSnapshot);
        }

        // Programmatic hook mapping for downstream module integrations
        switch (viewKey) {
            case "quests":
                if (QuestsModule) QuestsModule.render(freshStateSnapshot);
                break;
            case "boss":
                if (BossesModule) BossesModule.render(freshStateSnapshot);
                break;
            case "skills":
                if (SkillsModule) SkillsModule.render(freshStateSnapshot);
                break;
            case "vocab":
                if (VocabModule) VocabModule.render(freshStateSnapshot);
                break;
            case "shop":
                if (EconomyModule) EconomyModule.render(freshStateSnapshot);
                break;
            case "profile":
                this.refreshProfileDossierView(freshStateSnapshot);
                break;
        }
    },

    /**
     * Refreshes dashboard metrics, gauges, and health/mana bars.
     * @param {Object} state 
     */
    refreshDashboardViewVitals(state) {
        const p = state.player;

        document.getElementById("dash-hp-text").textContent = `${p.hp} / ${p.maxHp}`;
        const hpPct = Math.min(100, Math.floor((p.hp / p.maxHp) * 100));
        document.getElementById("dash-hp-fill").style.width = `${hpPct}%`;

        document.getElementById("dash-mp-text").textContent = `${p.mp} / ${p.maxMp}`;
        const mpPct = Math.min(100, Math.floor((p.mp / p.maxMp) * 100));
        document.getElementById("dash-mp-fill").style.width = `${mpPct}%`;

        document.getElementById("stat-str").textContent = p.stats.str;
        document.getElementById("stat-vit").textContent = p.stats.vit;
        document.getElementById("stat-agi").textContent = p.stats.agi;
        document.getElementById("stat-int").textContent = p.stats.int;
        document.getElementById("stat-points-value").textContent = p.statPoints;

        if (StreakModule) {
            StreakModule.refreshWidget(state);
        }
    },

    /**
     * Compiles registry totals and syncs values to the dossier view.
     * @param {Object} state 
     */
    refreshProfileDossierView(state) {
        document.getElementById("prof-codename").textContent = state.player.title;
        document.getElementById("prof-rank").textContent = state.player.rank;
        document.getElementById("prof-total-quests").textContent = state.counters.totalQuestsCompleted;
        document.getElementById("prof-total-bosses").textContent = state.boss.clearedCount;
        document.getElementById("prof-total-vocab").textContent = state.counters.totalVocabMemorized;
    },

    /**
     * External setter allowing asynchronous modules to bind to the runtime core smoothly.
     */
    registerModuleHook(key, moduleRef) {
        if (key === "quests") QuestsModule = moduleRef;
        if (key === "boss") BossesModule = moduleRef;
        if (key === "skills") SkillsModule = moduleRef;
        if (key === "vocab") VocabModule = moduleRef;
        if (key === "shop") EconomyModule = moduleRef;
        if (key === "streak") StreakModule = moduleRef;
    },

    /**
     * Triggers the full system cinematic animation card overlay for level ups.
     */
    triggerCinematicLevelOverlay(gains, targetLevel) {
        const modal = document.getElementById("modal-level-up-cinematic");
        if (!modal) return;

        const container = document.getElementById("level-up-stat-gains");
        container.innerHTML = `
            <div style="font-size:16px; font-weight:900; color:#00d2ff; margin-bottom:4px;">EVOLVED TO LEVEL ${targetLevel}</div>
            <div style="display:flex; justify-content:space-between;"><span>STRENGTH:</span><span>+${gains.str}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>VITALITY:</span><span>+${gains.vit}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>AGILITY:</span><span>+${gains.agi}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>INTELLIGENCE:</span><span>+${gains.int}</span></div>
        `;
        modal.classList.remove("system-hidden");
    }
};

// Auto-boot configuration lifecycle when DOM load parameters match
document.addEventListener("DOMContentLoaded", () => {
    AppCore.init();
});
