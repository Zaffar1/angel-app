function parsePagination(query){
    const page = Math.max(1,parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.max(100, parseInt(query.limit,10) || 10));
    const skip = (page - 1)* limit;

    return { page, limit, skip };
}

module.exports = { parsePagination };