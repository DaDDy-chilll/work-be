const getFilterForGetAllUsers = ({ query: originalQuery }) => {
  const { sort, limit, page, ...query } = originalQuery;
  const skip = (page - 1) * limit;
  const filter = {};

  if (query.name) {
    filter.name = {
      $regex: query.name,
      $options: 'i',
    };
  }

  if (query.department) {
    filter.department = {
      $regex: query.department,
      $options: 'i',
    };
  }

  return { filter, sort, limit, skip };
};

module.exports = {
  getFilterForGetAllUsers,
};
