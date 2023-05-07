const awilix = require('awilix');
const createAuthController = require('./controllers/auth.controller');
const createDocumentController = require('./controllers/document.controller');
const createDocumentReviewersController = require('./controllers/reviewer-groups.controller');
const createUserController = require('./controllers/user.controller');
const createAuthService = require('./services/auth.service');
const createDocumentService = require('./services/document.service');
const createHistoryService = require('./services/history.service');
const createReviewersService = require('./services/reviewer-groups.service');
const createRevisionService = require('./services/revision.service');
const createUserService = require('./services/user.service');
const Document = require('./models/document.model');
const History = require('./models/history.model');
const ReviewerGroup = require('./models/reviewer-group.model');
const Revision = require('./models/revisions.model');
const User = require('./models/user.model');

const container = awilix.createContainer();

function loadControllers() {
  const controllers = {
    authController: awilix.asFunction(createAuthController),
    documentController: awilix.asFunction(createDocumentController),
    reviewerGroupController: awilix.asFunction(
      createDocumentReviewersController
    ),
    userController: awilix.asFunction(createUserController),
  };

  container.register(controllers);
}

function loadServices() {
  const services = {
    authService: awilix.asFunction(createAuthService),
    documentService: awilix.asFunction(createDocumentService),
    historyService: awilix.asFunction(createHistoryService),
    reviewerGroupService: awilix.asFunction(createReviewersService),
    revisionService: awilix.asFunction(createRevisionService),
    userService: awilix.asFunction(createUserService),
  };

  container.register(services);
}

function loadModels() {
  const models = {
    Document: awilix.asValue(Document),
    History: awilix.asValue(History),
    ReviewerGroup: awilix.asValue(ReviewerGroup),
    Revision: awilix.asValue(Revision),
    User: awilix.asValue(User),
  };

  container.register(models);
}

function loadContainer() {
  loadModels();
  loadServices();
  loadControllers();
}

module.exports = {
  loadContainer,
  container,
};
