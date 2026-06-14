/**
 * CianOS Ultra V3 - Instance Gate Raid Subsystem
 * Orchestrates real-time countdown loops and stat-driven damage calculations.
 */

import { StateManager } from "../state.js";
import { XpEngine } from "../utils/xpEngine.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const BossesModule = {
    combatTimerInterval: null,

    /**
     * Renders active dungeon metrics and current encounter parameters.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    render(state) {
        const target = document.getElementById("boss-raid-target");
        if (!target) return;

        const boss = state.boss;
        const player = state.player;

        // If the dungeon clock is winding down, display an active combat room
        if (boss.activeCombatInstance) {
            this.renderCombatArena(target, boss, player);
            return;
        }

        // Standard layout display when no active instances are run
        target.innerHTML = `
            <div class="boss-roster-card">
                <div class="boss-header-tag">GATE DEEP DISCOVERY // INSTANT RECON</div>
                <h3>${boss.name.toUpperCase()}</h3>
                <div style="font-family:'Orbitron', sans-serif; font-size:11px; margin: 8px 0; color:#94a3b8;">
                    TARGET DESCRIPTOR: CALAMITY BARON CLASS REVENANT
                </div>
                
                <div class="boss-spec-matrix" style="margin:16px 0; font-size:12px; background:rgba(0,0,0,0.4); padding:12px; border:1px solid rgba(255,255,255,0.05); border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>TARGET HEALTH POOL:</span>
                        <span style="color:#ef4444; font-weight:900;">${boss.maxHp.toLocaleString()} HP</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>ENCOUNTER WINDOW:</span>
                        <span style="color:#eab308;">${boss.timeLimitSecs} SECONDS</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>CLEAR RECORD TALLY:</span>
                        <span style="color:#00d2ff;">${boss.clearedCount} DUNGEONS</span>
                    </div>
                </div>

                <div class="quest-reward-row" style="margin-bottom:16px;">
                    <span><i class="fa-solid fa-bolt"></i> +${boss.rewards.xp} XP</span>
                    <span><i class="fa-solid fa-coins"></i> +${boss.rewards.gold} GOLD</span>
                    <span><i class="fa-solid fa-gem"></i> +${boss.rewards.crystals} CRYSTALS</span>
                </div>

                <button id="btn-instantiate-raid" class="quest-action-trigger-btn rank-daily" style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%); border-color: #ef4444;">
                    <i class="fa-solid fa-door-open"></i> BREACH INSTANCE GATE
                </button>
            </div>
        `;

        this.bindGateEntryTriggers();
    },

    /**
     * Renders active active-combat control dashboard widgets.
     */
    renderCombatArena(target, boss, player) {
        const hpPct = Math.min(100, Math.floor((boss.hp / boss.maxHp) * 100));
        const timePct = Math.min(100, Math.floor((boss.timeLeft / boss.timeLimitSecs) * 100));

        target.innerHTML = `
            <div class="boss-roster-card combat-arena-pulse">
                <div class="boss-header-tag" style="background:#ef4444; color:#fff; animation: flash 1s infinite alternate;">
                    ⚠️ INTRUSION LIVE // INSTANCE ROOM RED ZONE
                </div>
                <h3>${boss.name.toUpperCase()}</h3>
                
                <!-- Boss Health Bar -->
                <div style="margin:16px 0 8px 0;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; font-family:'Orbitron', sans-serif; margin-bottom:4px;">
                        <span>TARGET DISPLACEMENT POOL</span>
                        <span style="color:#ef4444; font-weight:700;">${boss.hp} / ${boss.maxHp} HP (${hpPct}%)</span>
                    </div>
                    <div class="hud-meter-container" style="background:rgba(239, 68, 68, 0.1); border-color:rgba(239, 68, 68, 0.3);">
                        <div class="meter-fill" style="width: ${hpPct}%; background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%); box-shadow: 0 0 10px #ef4444;"></div>
                    </div>
                </div>

                <!-- Clock Bar -->
                <div style="margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; font-family:'Orbitron', sans-serif; margin-bottom:4px;">
                        <span>DIMENSIONAL ANCHOR STABILITY</span>
                        <span style="color:#eab308; font-weight:700;">${boss.timeLeft}s REMAINING</span>
                    </div>
                    <div class="hud-meter-container" style="background:rgba(234, 179, 8, 0.1); border-color:rgba(234, 179, 8, 0.3); height:6px;">
                        <div class="meter-fill" style="width: ${timePct}%; background: #eab308;"></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
                    <button id="btn-raid-strike" class="quest-action-trigger-btn rank-daily" style="margin-top:0; background:#fff; color:#000; font-weight:900;">
                        <i class="fa-solid fa-swords"></i> EXECUTE STRIKE
                    </button>
                    <button id="btn-raid-flee" class="quest-action-trigger-btn" style="margin-top:0; background:rgba(255,255,255,0.05); color:#94a3b8; border-color:transparent;">
                        <i class="fa-solid fa-person-running"></i> FALL BACK
                    </button>
                </div>
            </div>
        `;

        this.bindCombatArenaTriggers();
    },

    bindGateEntryTriggers() {
        const btn = document.getElementById("btn-instantiate-raid");
        if (btn) {
            btn.addEventListener("click", () => this.initializeCombatInstance());
        }
    },

    bindCombatArenaTriggers() {
        const strikeBtn = document.getElementById("btn-raid-strike");
        if (strikeBtn) {
            strikeBtn.addEventListener("click", () => this.executeCombatStrikeStep());
        }

        const fleeBtn = document.getElementById("btn-raid-flee");
        if (fleeBtn) {
            fleeBtn.addEventListener("click", () => this.terminateCombatLoop(false));
        }
    },

    /**
     * Locks local data snapshots and spins up interval clocks to handle time step regressions.
     */
    initializeCombatInstance() {
        const state = StateManager.getState();
        
        StateManager.update("boss", (b) => {
            b.activeCombatInstance = true;
            b.hp = b.maxHp;
            b.timeLeft = b.timeLimitSecs;
            return b;
        });

        ToastEngine.trigger("DUNGEON LOCK IN // ACTIVE THREAT INBOUND", "danger");

        // Set up real-time structural processing loops
        this.combatTimerInterval = setInterval(() => {
            this.executeCombatTickStep();
        }, 1000);

        this.render(StateManager.getState());
    },

    /**
     * Evaluates continuous real-time ticking variables and forces failures when clocks run dry.
     */
    executeCombatTickStep() {
        const state = StateManager.getState();
        let b = state.boss;

        if (!b.activeCombatInstance) {
            clearInterval(this.combatTimerInterval);
            return;
        }

        b.timeLeft -= 1;

        if (b.timeLeft <= 0) {
            clearInterval(this.combatTimerInterval);
            this.terminateCombatLoop(false, "DIMENSIONAL ANCHOR COLLAPSED // RAID TIMEOUT");
            return;
        }

        StateManager.update("boss", () => b);
        this.render(StateManager.getState());
    },

    /**
     * Calculates user damage output and applies modifications to data structures.
     */
    executeCombatStrikeStep() {
        const state = StateManager.getState();
        let b = state.boss;
        const p = state.player;

        // Damage formula scales linearly off player Strength stat
        const baseDamage = 15 + (p.stats.str * 4);
        const randomVariance = Math.floor(Math.random() * 6);
        const finalDamageDealt = baseDamage + randomVariance;

        b.hp = Math.max(0, b.hp - finalDamageDealt);
        ToastEngine.trigger(`STRIKE LANDED // DEALT ${finalDamageDealt} DAMAGE`, "system");

        if (b.hp <= 0) {
            clearInterval(this.combatTimerInterval);
            this.terminateCombatLoop(true);
            return;
        }

        StateManager.update("boss", () => b);
        this.render(StateManager.getState());
    },

    /**
     * Closes loops, clears timeouts, and distributes global currency and XP rewards.
     * @param {boolean} isVictorious 
     * @param {string|null} customFailMessage
     */
    terminateCombatLoop(isVictorious, customFailMessage = null) {
        clearInterval(this.combatTimerInterval);
        const state = StateManager.getState();
        
        if (isVictorious) {
            let b = state.boss;
            let p = state.player;

            b.clearedCount += 1;
            b.activeCombatInstance = false;

            p.gold += b.rewards.gold;
            p.crystals += b.rewards.crystals;

            const conversionResult = XpEngine.addXp(p, b.rewards.xp);

            StateManager.update("player", () => conversionResult.updatedPlayer);
            StateManager.update("boss", () => b);

            ToastEngine.trigger(`RAID CLEAR // INSTANCE CONQUERED`, "loot");
            ToastEngine.trigger(`REWARDS: +${b.rewards.gold}G, +${b.rewards.crystals}C`, "loot");

            if (conversionResult.levelsGained > 0) {
                AppCore.triggerCinematicLevelOverlay(conversionResult.statGains, conversionResult.updatedPlayer.level);
            }
        } else {
            StateManager.update("boss", (b) => {
                b.activeCombatInstance = false;
                return b;
            });
            
            const alertText = customFailMessage || "DUNGEON RAZED // ESCAPED FROM INSTANCE GATE";
            ToastEngine.trigger(alertText, "danger");
        }

        this.render(StateManager.getState());
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("boss", BossesModule);
