const {
  requestFormPermissions,
  documentSections,
  userRoles,
} = require('../constants');
const ApiError = require('../helpers/apiError');
const catchAsync = require('../helpers/catchAsync');
const documentService = require('../services/document.service');

const checkPermissions = (action) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    const document = await documentService.getDocumentById(req.params.id);

    if (!user.permissions[document.state.section][action]) {
      return next(
        ApiError.notAuthorized(`Not allowed to '${action}' the document.`)
      );
    }

    next();
  });
};

const checkFormPermissions = (action) => {
  return (req, res, next) => {
    if (!requestFormPermissions.includes(action)) {
      return next(ApiError.badRequest('Invalid Permission.'));
    }
    if (!req.user) {
      return next(ApiError.notAuthenticated());
    }

    const requestFormPermission = req.user.permissions.requestForm;

    if (!requestFormPermission[action]) {
      return next(ApiError.notAuthorized('Not allowed.'));
    }

    next();
  };
};

module.exports = checkFormPermissions;
