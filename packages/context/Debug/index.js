/*
 * IMPORTS
 */
import __debug from 'debug' // Npm: debug this module error with standalone color.
import AppRoot from 'app-root-path' // Npm: app root path module.
import Event from 'events' // Core: event emitter Maps.
import _ from 'underscore' // Npm: utility module.
import * as Sentry from '@sentry/node' // Npm: sentry for error tracking.


/*
 * GLOBALS.
 */
const Emitter = new Event.EventEmitter()


/*
 * SIBLINGS
 */
import Middleware from 'debuggermiddleware'
import { errorHandlers } from 'debbugererrors'


/*
 * EXPORTS
 */
export default function Debug($options) {
  // Error handling.
  try {
    // Only work if called as constructor.
    if (this instanceof Debug) {
      /*
       * Error logging for logging down all error
       * occurred which are unhandled.
       */
      this.Logger = function Logger({ error, message, state }, $optionss) {
        // Error handling.
        try {
          // Only show log if options is passed.
          // eslint-disable-next-line no-console
          if ($optionss && $optionss.showLog && 'ERROR' === state?.toUpperCase()) console.error(error)

          // Conditional log based on the environment.
          if (WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env) {
            // Conditional Debugging.
            if (message) {
              // Local variable.
              let debug

              // Break field by -> if provided.
              const _field = this.field.split('->')

              // Standalone debugger.
              debug = __debug(_field[0])

              // Extend debugger by lopping through field.
              _.isArray(_field) && 1 < _field.length && _field.forEach(f => f === _field[0] ? void 0 : debug = debug.extend(`${f} `))

              // Extend debugger by lopping through field.
              debug = debug.extend(` ${state ?? 'executing'} --> `)

              // Debug statement.
              debug(message)
            }

            // Report void.
            return void 0
          }


          /*
           * Only log error if given error is instanceof
           * Error else report void 0.
           */
          if (error instanceof Error) {
            // Return message.
            return {
              'message': error.message ?? 'Expected Error handling to be done. but it seems that no handler is present to handle this error. Check logs for error details.'
            }
          }

          // Report void 0
          return void 0
        } catch (errorr) {
          // Report failure.
          return errorr
        }
      }


      /*
       * QUEUE which contains all global handlers
       * in one place.
       */
      this.QUEUE = [...errorHandlers, this.Logger]

      /*
       * Setup sentry.io by loading up credentials
       * in sentry module.
       */
      if (!this.sentry.initialized) {
        /*
         * Avoid iife as sentry is required
         * for debugging and it has to be awaited
         */
        (async function IIFE(__Super__) {
          // Set sentry to true.
          __Super__.sentry.initialized = true

          // Sentry initialization.
          const _sentryInitialization = await Sentry.init(__Super__.sentry.configuration)

          /*
           * If sentry initialization contains
           * error than report failure.
           */
          if (_.propertyOf(_sentryInitialization)('Error')) throw _sentryInitialization.Error
        })(this)
      }

      /*
       * Execute this method after instance
       * initialization. and use it for debugging.
       */
      this.Main = async ({
        error,
        root,
        args,
        context,
        info,
        message,
        state
      }, __field) => {
        // Error handling.
        try {
          // State and error handling.
          const _state = error instanceof Error ? 'Error' : state ?? 'Executing'

          // Update properties.
          this.field = __field ?? this.field

          // Default style guide for given state and message.
          this.Logger({ error, 'state': _state, message }, $options)

          // Case handling.
          if (error instanceof Error) {
            /*
             * Error handling if error is reported
             * than capture given error with sentry.
             */
            const _ErrorHandling = await this.Error({ error, info, context, root, args })

            /*
             * If given error handling is instance
             * error than report failure.
             */
            if (_ErrorHandling instanceof Error) Sentry.captureException(_ErrorHandling)

            // Default style guide for given state and message.
            this.Logger({ error, 'state': _state, 'message': _ErrorHandling?.message }, $options)

            // Return error.
            return _ErrorHandling
          }

          // Return message.
          return { message }
        } catch (errorr) {
          // Report failure.
          return errorr
        }
      }

      /*
       * Create new middleware instance
       * if caught error than report failure
       */
      const _Middleware = new Middleware(
        { 'Debug': this.Main },
        {
          'middlewares': this.QUEUE && this.QUEUE[this.field] ? this.QUEUE[this.field] : this.QUEUE
        },
        {
          ...$options,
          'projectRoot': this.projectRoot
        }
      )

      /*
       * If middleware caught error than
       * report failure.
       */
      if (_Middleware instanceof Error) return _Middleware

      // Update properties to instance.
      this.Middleware = _Middleware
      this.Emit = (__channel, __message) => Emitter.emit(__channel, __message)

      // Events
      Emitter.on('error', error => this.Main({ error }))

      // Return instance.
      return this
    }

    // Report failure.
    return new Error('NOT__CONSTRUCTOR')
  } catch (error) {
    // Report failure.
    return error
  }
}

/*
 * PROTOTYPE.
 */
Debug.prototype = {
  // Properties
  'name': 'Debug',
  'field': 'Debugger',
  'projectRoot': AppRoot.path,
  'sentry': {
    'initialized': false,
    'configuration': {
      'dsn': CONFIG_RC.debug.dsn,
      'attachStacktrace': true,
      'debug': WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env,
      'tracesSampleRate': 1.0,
      'profilesSampleRate': 1.0,
      'integrations': [new Sentry.Integrations.Http({ 'tracing': true })]
    }
  },

  /*
   * Middleware for running method's
   * associated to fields
   */
  'Error': function({ root, args, context, info, error }) { return this.Middleware.Main(root, args, context, info, error) }
}
