/**
 * CianOS Ultra V3 - Live Toast Notification Engine
 * Manages tactical alert layers overlaying the mobile HUD workspace.
 */

export const ToastEngine = {
    // Structural layout target mapping
    getAnchor() {
        return document.getElementById('toast-notification-hub');
    },

    /**
     * Spawns a high-fidelity system alert box inside the active layout context.
     * @param {string} message - Literal notification string text content.
     * @param {'system'|'loot'|'danger'} type - Core color/theme configuration selector.
     * @param {number} durationMs - Active visible execution lifespan window.
     */
    trigger(message, type = 'system', durationMs = 3000) {
        const anchor = this.getAnchor();
        if (!anchor) {
            console.error("SYS-ERR [ToastEngine]: Notification overlay anchor element was not found in active view DOM context.");
            return;
        }

        // Programmatically generate standard visual node wrappers
        const toastNode = document.createElement('div');
        toastNode.className = `toast-unit toast-type-${type}`;

        // Map appropriate typography iconography assets based on alert configuration
        let iconMarkup = '<i class="fa-solid fa-bell"></i>';
        if (type === 'loot') {
            iconMarkup = '<i class="fa-solid fa-gift"></i>';
        } else if (type === 'danger') {
            iconMarkup = '<i class="fa-solid fa-skull-crossbones"></i>';
        } else if (type === 'system') {
            iconMarkup = '<i class="fa-solid fa-gear-code"></i>';
        }

        toastNode.innerHTML = `
            ${iconMarkup}
            <span>${message.toUpperCase()}</span>
        `;

        // Append to the active notification pool overlay layer
        anchor.appendChild(toastNode);

        // Schedule structural lifecycle exit removal routines cleanly
        const triggerExitAnimationTimeout = setTimeout(() => {
            this.dismiss(toastNode);
        }, durationMs);

        // Allow immediate manual dismissal interactions on precise viewport pointer triggers
        toastNode.style.pointerEvents = 'auto';
        toastNode.addEventListener('click', () => {
            clearTimeout(triggerExitAnimationTimeout);
            this.dismiss(toastNode);
        });
    },

    /**
     * Orchestrates visual exit sequences before executing final garbage disposal routines.
     * @param {HTMLElement} node 
     */
    dismiss(node) {
        if (!node || !node.parentNode) return;
        
        node.classList.add('toast-out');
        
        // Wait for CSS standard transition duration timings safely before dropping node references
        node.addEventListener('animationend', () => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }, { once: true });
    }
};
