const paginationStore = new Map();

function setPagination(messageId, data) {
    paginationStore.set(messageId, data);
}

function getPagination(messageId) {
    return paginationStore.get(messageId);
}

function deletePagination(messageId) {
    paginationStore.delete(messageId);
}

module.exports = { setPagination, getPagination, deletePagination };
