class ApiError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid Request', data = null) {
    return new ApiError(message, 400, data);
  }

  static notAuthenticated(message = 'Not Authenticated', data = null) {
    return new ApiError(message, 401, data);
  }

  static notAuthorized(message = 'Not Authorized', data = null) {
    return new ApiError(message, 403, data);
  }

  static notFound(message = 'Invalid Endpoint') {
    return new ApiError(message, 404);
  }
}

module.exports = ApiError;
