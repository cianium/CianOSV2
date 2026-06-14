/**
 * CianOS Ultra V3 - Dimensional Exchange Economy Store
 * Manages currency conversions, inventory acquisitions, and financial point check structures.
 */

import { StateManager } from "../state.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const EconomyModule = {
    // Configured pricing matrix for standard market operations
    EXCHANGE_RATE: 500, // 1 Crystal -> 500 Gold pieces

    /**
     * Renders standard exchange inventory listings and balance monitors.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    render(state) {
        const target = document.getElementById("shop-list-target");
        if (!target) return;

        const player = state.player;
        const shopInventory = state.shop || [];

        target.innerHTML = `
            <!-- Currency Exchange Section -->
            <div class="shop-exchange-banner" style="background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%); border: 1px solid rgba(168, 85, 247, 0.4); padding: 16px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #c084fc; font-family: 'Orbitron', sans-serif; letter-spacing: 1px;">DIMENSIONAL CURRENCY CONVERSION</h4>
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">Liquidate premium crystals into operational gold reserves instantly.</p>
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="font-family: 'Orbitron', sans-serif; font-size: 12px; color: #fff;">1 CRYSTAL = <span style="color: #eab308; font-weight: 700;">500 GOLD</span></span>
                    <button id="btn-execute-currency-swap" class="quest-action-trigger-btn rank-daily" style="margin: 0; width: auto; padding: 6px 14px; font-size: 11px; background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); border-color: #c084fc;">
                        <i class="fa-solid fa-right-left"></i> SWAP 1 CRYSTAL
                    </button>
                </div>
            </div>

            <!-- Merchandise Catalog Grid -->
            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-family: 'Orbitron', sans-serif; color: #94a3b8; letter-spacing: 1px;">AVAILABLE GEAR & INVENTORY</h4>
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                ${shopInventory.map(item => {
                    const canAfford = player.gold >= item.cost;
                    return `
                        <div class="shop-hud-card" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <h4 style="margin: 0; font-size: 14px; color: #fff; font-weight: 700;">${item.name.toUpperCase()}</h4>
                                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${item.desc}</p>
                                </div>
                                <span style="font-family: 'Orbitron', sans-serif; font-size: 13px; color: #eab308; font-weight: 900; background: rgba(234, 179, 8, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(234, 179, 8, 0.2);">
                                    <i class="fa-solid fa-coins"></i> ${item.cost.toLocaleString()}
                                </span>
                            </div>
                            
                            <button class="shop-buy-trigger-btn quest-action-trigger-btn" 
                                    data-item-id="${item.id}"
                                    ${!canAfford ? 'disabled' : ''} 
                                    style="margin: 0; background: ${canAfford ? 'rgba(255,255,255,0.05)' : '#1e293b'}; color: ${canAfford ? '#fff' : '#475569'}; border-color: ${canAfford ? 'rgba(255,255,255,0.1)' : 'transparent'};">
                                <i class="fa-solid fa-cart-shopping"></i> ACQUIRE ITEM
                            </button>
                        </div>
                    `;
                }).join("")}
            </div>
        `;

        this.bindMarketplaceInteractions();
    },

    /**
     * Connects event handlers to currency transactions and purchase paths.
     */
    bindMarketplaceInteractions() {
        const swapBtn = document.getElementById("btn-execute-currency-swap");
        if (swapBtn) {
            swapBtn.addEventListener("click", () => this.executePremiumCurrencyExchange());
        }

        document.querySelectorAll(".shop-buy-trigger-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const itemId = e.currentTarget.getAttribute("data-item-id");
                this.processItemAcquisition(itemId);
            });
        });
    },

    /**
     * Converts single crystals into gold pieces and triggers updates.
     */
    executePremiumCurrencyExchange() {
        const state = StateManager.getState();
        let player = state.player;

        if (player.crystals < 1) {
            ToastEngine.trigger("CONVERSION REJECTED // INSUFFICIENT DIMENSIONAL CRYSTALS", "danger");
            return;
        }

        // Apply currency adjustments
        player.crystals -= 1;
        player.gold += this.EXCHANGE_RATE;

        StateManager.update("player", () => player);
        ToastEngine.trigger(`EXCHANGE VERIFIED // +${this.EXCHANGE_RATE} GOLD INSTANTIATED`, "loot");

        this.render(StateManager.getState());
    },

    /**
     * Checks balances, updates currency files, and confirms trades.
     * @param {string} itemId 
     */
    processItemAcquisition(itemId) {
        const state = StateManager.getState();
        const targetItem = state.shop.find(i => i.id === itemId);
        if (!targetItem) return;

        let player = state.player;

        if (player.gold < targetItem.cost) {
            ToastEngine.trigger("PURCHASE DENIED // ACCOUNT BALANCE DEFICIT", "danger");
            return;
        }

        // Deduct transactional funds cleanly
        player.gold -= targetItem.cost;

        StateManager.update("player", () => player);
        ToastEngine.trigger(`TRANSACTION SUCCESSFUL // ACQUIRED: ${targetItem.name.toUpperCase()}`, "loot");

        this.render(StateManager.getState());
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("shop", EconomyModule);
