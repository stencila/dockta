/**
 * Base class for application errors
 */
export class ApplicationError extends Error {}

/**
 * A network error e.g. request timeout
 */
export class NetworkError extends ApplicationError {}

/**
 * A permissions error
 */
export class PermissionError extends ApplicationError {}
