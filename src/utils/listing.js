function parsePagination(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

function paginatedResponse(data, total, page, limit) {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
}

function addLikeFilter(filters, values, column, value) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
        filters.push(`${column} LIKE ?`);
        values.push(`%${String(value).trim()}%`);
    }
}

module.exports = {
    addLikeFilter,
    paginatedResponse,
    parsePagination
};
