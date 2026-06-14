/**
 * CianOS Ultra V3 - Shadow Archive Lexicon Core
 * Manages flashcard tracking, status filtering, and intelligence-driven study rewards.
 */

import { StateManager } from "../state.js";
import { ToastEngine } from "../utils/toast.js";
import { AppCore } from "../app.js";

export const VocabModule = {
    activeFilter: "all", // "all" | "learning" | "mastered"

    /**
     * Renders lexicon entries and study status filters.
     * @param {Object} state - Deep snapshot clone from global storage state
     */
    render(state) {
        const target = document.getElementById("vocab-list-target");
        if (!target) return;

        const lexicon = state.vocab || [];
        
        // Filter elements out using structural status labels
        const filteredLexicon = lexicon.filter(item => {
            if (this.activeFilter === "learning") return !item.mastered;
            if (this.activeFilter === "mastered") return item.mastered;
            return true;
        });

        if (filteredLexicon.length === 0) {
            target.innerHTML = `
                <div style="text-align:center; padding:32px; color:#7388a1; font-family:'Orbitron', sans-serif; font-size:11px; letter-spacing:1px;">
                    <i class="fa-solid fa-book-sparkles" style="font-size:24px; margin-bottom:8px; display:block; color:rgba(255,255,255,0.1);"></i>
                    LEXICON MATRIX EMPTY FOR THIS INDEX
                </div>
            `;
            this.bindTabControls();
            return;
        }

        target.innerHTML = filteredLexicon.map(item => `
            <div class="vocab-hud-card ${item.mastered ? 'vocab-mastered' : 'vocab-learning'}">
                <div style="display:flex; justify-content:between; align-items:start;">
                    <div style="flex:1;">
                        <h4 style="margin:0; font-size:16px; letter-spacing:1px; color:#fff;">${item.word.toUpperCase()}</h4>
                        <span style="font-size:10px; font-family:'Orbitron', sans-serif; color:#00d2ff;">[${item.partOfSpeech.toUpperCase()}]</span>
                    </div>
                    <div>
                        <span class="vocab-status-badge">${item.mastered ? 'MASTERED' : 'LEARNING'}</span>
                    </div>
                </div>
                
                <p style="margin:8px 0; font-size:13px; color:#cbd5e1; font-style:italic;">"${item.definition}"</p>
                
                <div style="font-size:11px; color:#94a3b8; margin-bottom:12px; background:rgba(0,0,0,0.2); padding:6px; border-radius:4px;">
                    <strong>CONTEXT:</strong> ${item.example}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="font-size:11px; font-family:'Orbitron', sans-serif; color:#64748b;">
                        STREAK: ${item.streak} / 3 MARKS
                    </span>
                    ${!item.mastered ? `
                        <button class="vocab-review-trigger-btn quest-action-trigger-btn rank-daily" 
                                data-word-id="${item.id}" 
                                style="margin:0; padding:4px 12px; font-size:10px; width:auto; background:linear-gradient(135deg, #15803d 0%, #166534 100%); border-color:#22c55e;">
                            <i class="fa-solid fa-brain"></i> RECORD RECALL
                        </button>
                    ` : `
                        <span style="font-size:11px; font-family:'Orbitron', sans-serif; color:#22c55e; font-weight:700;">
                            <i class="fa-solid fa-shield-halved"></i> ARCHIVED PERMANENTLY
                        </span>
                    `}
                </div>
            </div>
        `).join("");

        this.bindTabControls();
        this.bindActionTriggers();
    },

    /**
     * Attaches click handlers to navigation nodes inside the vocab section.
     */
    bindTabControls() {
        const tabs = document.querySelectorAll(".vocab-filter-tabs .vocab-tab");
        tabs.forEach(tab => {
            const filterAttr = tab.getAttribute("data-vocab-filter");
            
            if (filterAttr === this.activeFilter) {
                tab.classList.add("active-tab");
            } else {
                tab.classList.remove("active-tab");
            }

            // Clean binding pattern to remove older memory references
            tab.replaceWith(tab.cloneNode(true));
        });

        // Re-bind fresh click operations safely
        document.querySelectorAll(".vocab-filter-tabs .vocab-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                this.activeFilter = e.currentTarget.getAttribute("data-vocab-filter");
                this.render(StateManager.getState());
            });
        });
    },

    /**
     * Attaches interaction logic to flashcard review actions.
     */
    bindActionTriggers() {
        document.querySelectorAll(".vocab-review-trigger-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const wordId = e.currentTarget.getAttribute("data-word-id");
                this.processVocabularyRecallSuccess(wordId);
            });
        });
    },

    /**
     * Increments recall counts and scales player Intelligence when mastery points hit limits.
     * @param {string} wordId 
     */
    processVocabularyRecallSuccess(wordId) {
        const state = StateManager.getState();
        const itemIndex = state.vocab.findIndex(v => v.id === wordId);
        if (itemIndex === -1) return;

        const targetWord = state.vocab[itemIndex];
        let player = state.player;
        let counters = state.counters;

        let trackingStreak = targetWord.streak + 1;
        let isNowMastered = targetWord.mastered;

        ToastEngine.trigger(`RECALL VERIFIED // RECORDED SUCCESSFUL RETENTION`, "system");

        if (trackingStreak >= 3) {
            isNowMastered = true;
            counters.totalVocabMemorized += 1;
            
            // Intelligence parameter scales upon structural lexicon archival unlocks
            player.stats.int += 1;
            player.maxMp = 100 + (player.stats.int * 10);
            player.mp = player.maxMp; // Restore reserves dynamically

            ToastEngine.trigger(`LEXICON ARCHIVED // INTELLIGENCE INCREMENTED (+1 INT)`, "loot");
        }

        // Commit deep mutations back safely to global registries
        StateManager.update("vocab", (currentVocab) => {
            currentVocab[itemIndex].streak = trackingStreak;
            currentVocab[itemIndex].mastered = isNowMastered;
            return currentVocab;
        });
        StateManager.update("player", () => player);
        StateManager.update("counters", () => counters);

        // Force a re-render cycle across views to accurately update current values
        this.render(StateManager.getState());
        AppCore.executeModuleRender("dashboard");
    }
};

// Bind cleanly into AppCore orchestration layer
AppCore.registerModuleHook("vocab", VocabModule);
