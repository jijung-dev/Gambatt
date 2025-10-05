// -------------------- PAGINATION STORE --------------------

const paginationStore = new Map();

/**
 * Store pagination data for a message
 * @param {string} messageId
 * @param {object} data
 */
function setPagination(messageId, data) {
    paginationStore.set(messageId, data);
}

/**
 * Retrieve pagination data for a message
 * @param {string} messageId
 * @returns {object | undefined}
 */
function getPagination(messageId) {
    return paginationStore.get(messageId);
}

/**
 * Delete pagination data for a message
 * @param {string} messageId
 */
function deletePagination(messageId) {
    paginationStore.delete(messageId);
}

// -------------------- EXPORTS --------------------

export { setPagination, getPagination, deletePagination };
