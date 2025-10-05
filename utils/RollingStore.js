// =============================== ACTIVE ROLL STORE ===============================

const activeRolls = new Set();

/**
 * Mark a user as rolling
 * @param {string} userId
 */
function startRoll(userId) {
    activeRolls.add(userId);
}

/**
 * Remove a user from active rolls
 * @param {string} userId
 */
function endRoll(userId) {
    activeRolls.delete(userId);
}

/**
 * Check if user is rolling
 * @param {string} userId
 * @returns {boolean}
 */
function isRolling(userId) {
    return activeRolls.has(userId);
}

export { startRoll, endRoll, isRolling };
