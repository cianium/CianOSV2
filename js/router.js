/**
 * CianOS Ultra V3 - Hash Routing Navigation Engine
 */

export const Router = {
    // Structural layout route configuration parameters
    routes: {},
    currentView: null,

    /**
     * Registers view components to target destination keys.
     * @param {Object} routeConfigMap - Shape mapping { 'dashboard': () => void, 'quests': () => void }
     */
    init(routeConfigMap) {
        this.routes = routeConfigMap;

        // Establish core lifecycle listeners targeting structural mutations
        window.addEventListener("hashchange", () => this.handleRoutingSync());
        
        // Process default fallback routing on initial instantiation
        this.handleRoutingSync();
    },

    /**
     * Parses the active window address token and swaps active layout nodes.
     */
    handleRoutingSync() {
        const rawHash = window.location.hash || "#/dashboard";
        
        // Deconstruct string formats safely to match structural registration rules
        let cleanRouteKey = rawHash.replace(/^#\//, "");
        
        // Fail-safe default routing handling
        if (!this.routes[cleanRouteKey]) {
            console.warn(`SYS-WARN [Router]: Unrecognized route configuration token "${cleanRouteKey}". Enforcing fallback redirection.`);
            cleanRouteKey = "dashboard";
            window.location.hash = "#/dashboard";
            return;
        }

        this.currentView = cleanRouteKey;
        this.updateUiDomViews(cleanRouteKey);

        // Execute contextual module hooks to populate view areas dynamically
        try {
            this.routes[cleanRouteKey]();
        } catch (error) {
            console.error(`SYS-CRITICAL [Router]: Execution failure processing route render callback for [${cleanRouteKey}]:`, error);
        }
    },

    /**
     * Swaps display elements in the layout and syncs navigation highlights.
     * @param {string} targetedRouteKey 
     */
    updateUiDomViews(targetedRouteKey) {
        // Step A: Update dynamic visibility states on layout containers
        const allViews = document.querySelectorAll(".viewport-canvas .app-view");
        allViews.forEach(viewNode => {
            viewNode.classList.remove("dynamic-view-active");
        });

        const activeTargetDomView = document.getElementById(`view-${targetedRouteKey}`);
        if (activeTargetDomView) {
            activeTargetDomView.classList.add("dynamic-view-active");
        } else {
            console.error(`SYS-ERR [Router]: Visual view block container matching id "view-${targetedRouteKey}" is missing in root markup.`);
        }

        // Step B: Synchronize styling classes across the bottom navigation dock nodes
        const allNavNodes = document.querySelectorAll(".hud-navigation-dock .nav-node");
        allNavNodes.forEach(navNode => {
            const dataRouteAttr = navNode.getAttribute("data-route");
            if (dataRouteAttr === targetedRouteKey) {
                navNode.classList.add("active-node");
            } else {
                navNode.classList.remove("active-node");
            }
        });
    },

    /**
     * Programmatically forces the layout coordinates to transition to another view.
     * @param {string} destinationRouteKey 
     */
    navigateTo(destinationRouteKey) {
        window.location.hash = `#/${destinationRouteKey}`;
    }
};
