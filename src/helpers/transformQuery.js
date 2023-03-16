const DOCS_LIMIT = 10;

function transformQuery(query) {
  const newQuery = { ...query };
  newQuery.page = query.page ? parseInt(query.page, 10) : 1;
  newQuery.skip = (newQuery.page - 1) * DOCS_LIMIT;
  newQuery.sort = query.sort || '-createdAt';

  return newQuery;
}

module.exports = transformQuery;
