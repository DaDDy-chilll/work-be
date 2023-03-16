const DOCS_LIMIT = 10;

function getPaginationInfo(query) {
  const newQuery = { ...query };
  const page = query.page ? parseInt(query.page, 10) : 1;
  newQuery.skip = (page - 1) * DOCS_LIMIT;
  newQuery.sort = query.sort || '-createdAt';
  newQuery.limit = DOCS_LIMIT;

  return newQuery;
}

module.exports = getPaginationInfo;
