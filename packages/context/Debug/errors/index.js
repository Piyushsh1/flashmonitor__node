/*
 * IMPORTS
 */
import * as Sentry from '@sentry/node' // Npm: sentry for error tracking.


/*
 * SIBLINGS
 */
import Context from 'debbugererrorscontext' // Custom: context error handler.


/*
 * EXPORTS
 */
export const errorHandlers = [
  /*
   * List of error handler's for handling
   * error's raised during execution.
   */
  Context,
  // eslint-disable-next-line no-console
  ({ error }) => Sentry.captureException(error),
  ({ error }) => error?.message.toLowerCase().includes('timeout') ? ({
    'message': 'Request timed out. Please try again later.',
    'status': 'REQUEST_TIMEOUT'
  }) : void 0,
  ({ error }) => error?.message.toLowerCase().includes('Timeout') ? ({
    'message': 'Request timed out. Please try again later.',
    'status': 'REQUEST_TIMEOUT'
  }) : void 0,
  ({ error }) => ({
    'message': error?.message?.toString?.(),
    'status': 'EXCEPTION_CAUGHT'
  })
]
