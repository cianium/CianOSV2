/**
 * CianOS Ultra V3 - System Date & Chrono Analytics Engine
 */

export const DateEngine = {
    /**
     * Normalizes a full date-time reference string into an absolute string literal calendar day.
     * Truncates time data matrices completely to eliminate hourly drifting bugs.
     * @param {string|Date|null} dateInput 
     * @returns {string} E.g., "2026-06-14"
     */
    getNormalizedDateString(dateInput = new Date()) {
        const targetDate = dateInput ? new Date(dateInput) : new Date();
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Determines whether two specific date references point to the exact same calendar day.
     * @param {string} isoStringA 
     * @param {string} isoStringB 
     * @returns {boolean}
     */
    isSameDay(isoStringA, isoStringB) {
        if (!isoStringA || !isoStringB) return false;
        return this.getNormalizedDateString(isoStringA) === this.getNormalizedDateString(isoStringB);
    },

    /**
     * Determines whether target reference date strings fall exactly on the calendar day prior to the baseline date.
     * Used for verifying daily check-in streak continuations.
     * @param {string} previousDayIso 
     * @param {string} baselineDayIso 
     * @returns {boolean}
     */
    isConsecutiveDay(previousDayIso, baselineDayIso) {
        if (!previousDayIso || !baselineDayIso) return false;
        
        const prevString = this.getNormalizedDateString(previousDayIso);
        const baseString = this.getNormalizedDateString(baselineDayIso);
        
        const prevDate = new Date(prevString);
        const baseDate = new Date(baseString);
        
        // Calculate the difference in milliseconds
        const differenceMs = baseDate.getTime() - prevDate.getTime();
        // Convert to absolute whole days
        const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));
        
        return differenceDays === 1;
    },

    /**
     * Determines if a user's inactivity window has broken their streak.
     * Triggers a streak reset if the gap since their last log exceeds 24 hours.
     * @param {string} lastActiveIsoString 
     * @returns {boolean} True if the streak is broken and must reset
     */
    hasStreakExpired(lastActiveIsoString) {
        if (!lastActiveIsoString) return false;
        
        const currentDayStr = this.getNormalizedDateString(new Date());
        const lastActiveDayStr = this.getNormalizedDateString(lastActiveIsoString);
        
        if (currentDayStr === lastActiveDayStr) return false;
        
        const currentDate = new Date(currentDayStr);
        const lastActiveDate = new Date(lastActiveDayStr);
        
        const differenceMs = currentDate.getTime() - lastActiveDate.getTime();
        const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));
        
        // A gap greater than 1 day means they missed the check-in window
        return differenceDays > 1;
    },

    /**
     * Returns an array of formatted strings mapping the previous 7 calendar days.
     * Provides the historical data backbone for the dashboard's streak widget.
     * @returns {Array<{dateStr: string, label: string}>}
     */
    getPastWeekMatrix() {
        const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const matrix = [];
        const baseDate = new Date();

        for (let i = 6; i >= 0; i--) {
            const processingDate = new Date(baseDate);
            processingDate.setDate(baseDate.getDate() - i);
            
            matrix.push({
                dateStr: this.getNormalizedDateString(processingDate),
                label: weekdays[processingDate.getDay()]
            });
        }
        return matrix;
    }
};
