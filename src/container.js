const awilix = require('awilix');
const createAuthController = require('./controllers/auth.controller');
const createDocumentController = require('./controllers/document.controller');
const createDocumentReviewersController = require('./controllers/reviewer-groups.controller');
const createUserController = require('./controllers/user.controller');
const createHistoryController = require('./controllers/history.controller');
const createNotificationController = require('./controllers/notification.controller');
const createRevisionController = require('./controllers/revision.controller');
const createDepartmentController = require('./controllers/department.controller');

const createAuthService = require('./services/auth.service');
const createDocumentService = require('./services/document.service');
const createMentionService = require('./services/mention.service');
const createHistoryService = require('./services/history.service');
const createReviewersService = require('./services/reviewer-groups.service');
const createRevisionService = require('./services/revision.service');
const createUserService = require('./services/user.service');
const createNotificationService = require('./services/notification.service');
const { createDepartmentService } = require('./services/department.service');
const { createJwtService } = require('./services/jwt.service');
const {
  createImageManipulationService,
} = require('./services/image-manipulation.service');
const createFileStorageService = require('./services/file-storage.service');
const createEmitterService = require('./services/event-emitter.service');

const Document = require('./models/document.model');
const History = require('./models/history.model');
const ReviewerGroup = require('./models/reviewer-group.model');
const Revision = require('./models/revisions.model');
const User = require('./models/user.model');
const Notification = require('./models/notification.model');
const { Department } = require('./models/department.model');
const Mention = require('./models/mention.model');
const createDocumentHelper = require('./helpers/document.helper');

const container = awilix.createContainer();

function loadControllers() {
  const controllers = {
    authController: awilix.asFunction(createAuthController),
    documentController: awilix.asFunction(createDocumentController),
    reviewerGroupController: awilix.asFunction(
      createDocumentReviewersController
    ),
    userController: awilix.asFunction(createUserController),
    historyController: awilix.asFunction(createHistoryController),
    notificationController: awilix.asFunction(createNotificationController),
    revisionController: awilix.asFunction(createRevisionController),
    departmentController: awilix.asFunction(createDepartmentController),
  };

  container.register(controllers);
}

function loadServices() {
  const services = {
    authService: awilix.asFunction(createAuthService),
    documentService: awilix.asFunction(createDocumentService),
    mentionService: awilix.asFunction(createMentionService),
    historyService: awilix.asFunction(createHistoryService),
    reviewerGroupService: awilix.asFunction(createReviewersService),
    revisionService: awilix.asFunction(createRevisionService),
    userService: awilix.asFunction(createUserService),
    notificationService: awilix.asFunction(createNotificationService),
    departmentService: awilix.asFunction(createDepartmentService),
    jwtService: awilix.asFunction(createJwtService),
    fileStorageService: awilix.asFunction(createFileStorageService),
    imageManipulationService: awilix.asFunction(createImageManipulationService),
    emitter: awilix.asFunction(createEmitterService, {
      lifetime: awilix.Lifetime.SINGLETON,
    }),
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
    Notification: awilix.asValue(Notification),
    Department: awilix.asValue(Department),
    Mention: awilix.asValue(Mention),
  };

  container.register(models);
}

function loadHelpers() {
  const helpers = {
    documentHelper: awilix.asFunction(createDocumentHelper),
  };
  container.register(helpers);
}

function loadContainer() {
  loadModels();
  loadServices();
  loadControllers();
  loadHelpers();
}

module.exports = {
  loadContainer,
  container,
};
