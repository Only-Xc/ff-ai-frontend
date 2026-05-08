export { authPlugin } from './plugin/auth.js'
export {
  RequestError,
  isRequestError,
  normalizeRequestError,
} from './core/error.js'
export { errorHandlerPlugin } from './plugin/error-handler.js'
export { dedupePlugin, getPendingRequestKey } from './plugin/dedupe.js'
export { dataPlugin, unwrapCodeDataPlugin } from './plugin/response.js'
export { createRequestClient } from './core/client.js'
export { createRequestPlugin } from './core/plugin.js'
export type { RequestErrorOptions } from './core/error.js'
export type {
  AuthPluginOptions,
  CreateRequestClientOptions,
  ErrorHandlerPluginOptions,
  MaybePromise,
  RequestContext,
  RequestConfig,
  RequestClient,
  RequestErrorHandler,
  RequestPlugin,
  RequestTokenProvider,
  ResponseCode,
  UnwrapCodeDataPluginOptions,
} from './types.js'
