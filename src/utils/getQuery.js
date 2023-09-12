const DOCS_LIMIT = 10;

function getQuery(query) {
  const { sort = '-createdAt', page = '1', ...restQuery } = query;
  const numberedPage = parseInt(page, 10);
  const skip = (numberedPage - 1) * DOCS_LIMIT;
  const limit = DOCS_LIMIT;

  return {
    queryFilter: typeof restQuery === 'object' ? { ...restQuery } : {},
    sort,
    limit,
    skip,
  };
}

module.exports = getQuery;
