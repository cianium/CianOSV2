/**
 * CianOS Ultra V3 - Specialization Buff Mastery Core
 * Handles unlock validations, skill leveling formulas, and resource auditing.
 */

import { StateManager } from "../state.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const SkillsModule = {
    /**
     * Renders registered ability profiles and active mastery trees.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    render(state) {
        const target = document.getElementById("skills-list-target");
        if (!target) return;

        const skills = state.skills || [];
        const player = state.player;

        target.innerHTML = skills.map(skill => {
            const isUnlocked = player.level >= skill.requiredLevel;
            const upgradeCost = skill.baseCost * Math.pow(1.6, skill.level);
            const canAffordUpgrade = player.gold >= upgradeCost;

            return `
                <div class="skill-hud-card ${isUnlocked ? 'skill-node-unlocked' : 'skill-node-locked'}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="margin: 0; font-size: 14px; color: #fff;">${skill.name.toUpperCase()}</h4>
                            <span class="skill-rank-badge">RANK ${skill.level} / 5</span>
                        </div>
                        <div style="text-align: right; font-family: 'Orbitron', sans-serif; font-size: 11px;">
                            <span style="color: #00d2ff;"><i class="fa-solid fa-droplet"></i> ${skill.mpCost} MP</span>
                        </div>
                    </div>
                    
                    <p style="margin: 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">${skill.desc}</p>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-size: 11px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.02);">
                        <span style="color: #cbd5e1; font-weight: 700;">CURRENT BUFF EFFECT:</span> 
                        <span style="color: #22c55e;">+${skill.modifierPerLevel * skill.level}% Performance Scaling</span>
                    </div>

                    ${!isUnlocked ? `
                        <div class="skill-lock-overlay">
                            <i class="fa-solid fa-lock" style="margin-right: 6px;"></i> 
                            RESTRICTED // REQUIRES HUNTER LEVEL ${skill.requiredLevel}
                        </div>
                    ` : `
                        <div style="display: flex; gap: 8px;">
                            <button class="skill-upgrade-trigger-btn quest-action-trigger-btn" 
                                    data-skill-id="${skill.id}" 
                                    ${!canAffordUpgrade || skill.level >= 5 ? 'disabled' : ''} 
                                    style="margin: 0; background: ${skill.level >= 5 ? '#334155' : 'rgba(255,255,255,0.05)'}; flex: 1;">
                                <i class="fa-solid fa-arrow-up-from-line"></i> 
                                ${skill.level >= 5 ? 'MAX LEVEL' : `UPGRADE // <i class="fa-solid fa-coins"></i> ${Math.floor(upgradeCost).toLocaleString()}`}
                            </button>
                            <button class="skill-activate-trigger-btn quest-action-trigger-btn rank-daily" 
                                    data-skill-id="${skill.id}" 
                                    style="margin: 0; width: 90px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-color: #38bdf8;">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> CAST
                            </button>
                        </div>
                    `}
                </div>
            `;
        }).join("");

        this.bindAbilityInteractions();
    },

    /**
     * Binds internal events to upgrade loops and resource validation routines.
     */
    bindAbilityInteractions() {
        document.querySelectorAll(".skill-upgrade-trigger-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const skillId = e.currentTarget.getAttribute("data-skill-id");
                this.executeSkillLevelUpgrade(skillId);
            });
        });

        document.querySelectorAll(".skill-activate-trigger-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const skillId = e.currentTarget.getAttribute("data-skill-id");
                this.executeSkillCastRoute(skillId);
            });
        });
    },

    /**
     * Deducts gold balances, increments capability metrics, and stores tree state mutations.
     * @param {string} skillId 
     */
    executeSkillLevelUpgrade(skillId) {
        const state = StateManager.getState();
        const skillIndex = state.skills.findIndex(s => s.id === skillId);
        if (skillIndex === -1) return;

        const skill = state.skills[skillIndex];
        const cost = Math.floor(skill.baseCost * Math.pow(1.6, skill.level));
        let player = state.player;

        if (player.gold < cost) {
            ToastEngine.trigger("UPGRADE ABORTED // INSUFFICIENT GOLD RESERVES", "danger");
            return;
        }

        if (skill.level >= 5) {
            ToastEngine.trigger("UPGRADE ABORTED // SKILL MASTERY CAP REACHED", "danger");
            return;
        }

        player.gold -= cost;
        
        StateManager.update("skills", (currentSkills) => {
            currentSkills[skillIndex].level += 1;
            return currentSkills;
        });
        StateManager.update("player", () => player);

        ToastEngine.trigger(`SKILL EVOLVED // ${skill.name.toUpperCase()} RANK INCREMENTED`, "system");
        this.render(StateManager.getState());
    },

    /**
     * Validates mana limits, processes structural point cost drops, and casts buffs.
     * @param {string} skillId 
     */
    executeSkillCastRoute(skillId) {
        const state = StateManager.getState();
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return;

        let player = state.player;

        if (player.mp < skill.mpCost) {
            ToastEngine.trigger("CAST FAILED // INSUFFICIENT MANA ENERGY", "danger");
            return;
        }

        player.mp -= skill.mpCost;
        StateManager.update("player", () => player);

        ToastEngine.trigger(`BUFF UNLEASHED // ACTIVATED: ${skill.name.toUpperCase()}`, "loot");
        
        // Push instant feedback changes to the health/mana viewport monitors
        AppCore.executeModuleRender("dashboard");
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("skills", SkillsModule);
