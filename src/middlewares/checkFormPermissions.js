const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const documentService = require('../services/document.service');

const checkPermissions = (action) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    const document = await documentService.getDocumentById({
      id: req.params.id,
    });
    if (!user.permissions[document.state.section][action]) {
      return next(
        ApiError.notAuthorized(
          `Not allowed to '${action}' the document in '${document.state.section.toUpperCase()}' section.`
        )
      );
    }

    next();
  });
};

module.exports = checkPermissions;
