const catchAsync = require('../helpers/catchAsync');

function createDocumentAssigneesController() {
  const getAssigneesGroup = catchAsync(async (req, res, next) => {
    res.send('Hello world');
  });

  return { getAssigneesGroup };
}

module.exports = createDocumentAssigneesController();
