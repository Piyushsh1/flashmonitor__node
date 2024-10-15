/*
 * IMPORTS
 */
import Express from 'express' // Npm: Express library.
import Helmet from 'helmet' // Npm: helmet library.
import Graceful from '@ladjs/graceful' // Npm: graceful shutdown.
import Redis from 'ioredis' // Npm: redis library.
import StatsD from 'hot-shots' // Npm: statsd library.
import BasicAuth from 'express-basic-auth' // Npm: basic auth.
import Bree from 'bree' // Npm: bree library.
import Path from 'path' // Npm: path library.
import _ from 'underscore' // Npm: underscore library.
import { useLiveQuery } from '@envelop/live-query' // Npm: live query.
import { mw } from 'request-ip' // Npm: request-ip library.
import { createYoga } from 'graphql-yoga' // Npm: graphql server Maps.
import { createFetch } from '@whatwg-node/fetch' // Npm: fetch polyfill.
import { useAPQ } from '@graphql-yoga/plugin-apq' // Npm: automatic persisted queries.
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection' // Npm: disable introspection.
import { blockFieldSuggestionsPlugin } from '@escape.tech/graphql-armor-block-field-suggestions' // Npm: graphql armor.
import { useGraphQLMiddleware } from '@envelop/graphql-middleware' // Npm: graphql middleware.
import { useRateLimiter } from '@envelop/rate-limiter' // Npm: rate limiter.
import { EnvelopArmor } from '@escape.tech/graphql-armor' // Npm: graphql armor.
import { renderGraphiQL } from '@graphql-yoga/render-graphiql' // Npm: graphql render graphiql.
import { envelop } from '@envelop/core' // Npm: envelop core.
import { useResponseCache } from '@envelop/response-cache' // Npm: response cache.
import { createRedisCache } from '@envelop/response-cache-redis' // Npm: redis cache.
import { useGraphQlJit } from '@envelop/graphql-jit' // Npm: graphql jit.
import { useStatsD } from '@envelop/statsd' // Npm: statsd for benchmarking graphql.


/*
 * PACKAGES
 */
import '../../iife'
import Router from '../../routes'
import Context, { context, LiveStore } from '../../context'
import Middleware from '../../middleware'
import CronJobs from '../../cron'


/*
 * SIBLINGS
 */
import Hook from './hooks'
import BootHook from './hooks/boot'


/*
 * GLOBALS
 */
let _ExpressListener


/*
 * CONST
 */
const _Express = Express()
const _StatsD = new StatsD({
  'port': 8020,
  'globalTags': { 'env': WORKING_ENV.PRODUCTION.value === CONFIG_RC.env }
})
const _RedisClient = new Redis({
  'connectTimeout': 10000,
  'maxRetriesPerRequest': 3,
  'enableOfflineQueue': true,
  retry_strategy(__options) {
    if ('ECONNREFUSED' === __options.error.code) {
      /*
       * This will suppress the ECONNREFUSED unhandled exception
       * that results in app crash
       */
      return void 0
    }

    // Return error.
    return __options
  }
})
const _Cache = createRedisCache({ 'redis': _RedisClient })
const _Server = createYoga({
  'port': CONFIG_RC.graphqlPort,
  'cors':
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env ? {
      'origin': '*.smsflash.in',
      'credentials': true,
      'methods': [
        'POST',
        'GET',
        'PUT',
        'DELETE',
        'OPTIONS'
      ]
    } : void 0,
  renderGraphiQL,
  'batching': WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  'context': Context,
  'graphqlEndpoint': '/v1/graphql',
  'graphiql': {
    'subscriptionsProtocol': 'GRAPHQL_SSE'
  },
  'schema': Router,
  'landingPage': false,
  'fetchAPI': createFetch({
    'formDataLimits': {
      'fileSize': 1e7,
      'files': 10,
      'fieldSize': 1000000,
      'headerSize': 1000000
    }
  }),
  'parserCache': WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  'validationCache': WORKING_ENV.PRODUCTION.value === CONFIG_RC.env,
  'plugins': [
    useLiveQuery({ 'liveQueryStore': LiveStore }),
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env ? useDisableIntrospection() : void 0,
    WORKING_ENV.PRODUCTION.value === CONFIG_RC.env ? void 0 : blockFieldSuggestionsPlugin(),
    useAPQ({
      'responseConfig': {
        'forceStatusCodeOk': true
      }
    }),
    useGraphQLMiddleware(Middleware),
    envelop({
      'plugins': [
        useResponseCache({
          'cache': _Cache,
          'ttl': 60 * 1000 * 60,
          'ttlPerType': {
            'Stock': 500
          },
          'ignoredTypes': ['token']
        }),
        useGraphQlJit(),
        useStatsD({
          'client': _StatsD,
          'prefix': 'graphql',
          'skipIntrospection': false
        })
      ]
    }),
    useRateLimiter({
      'identifyFn': r => r?.Session?.user?.id
    }),
    ...new EnvelopArmor({ 'maxDepth': { 'n': 10 } }).protect().plugins
  ]
})


/*
 * MIDDLEWARE
 */
_Express.use(Helmet({ 'contentSecurityPolicy': ('production' === process.env.NODE_ENV) ? null : false }))
_Express.use(mw())
_Express.use(_Server.graphqlEndpoint, _Server)
_Express.use(Express.json())
_Express.post('/boot', BootHook)
_Express.use(
  BasicAuth({
    'users': { [CONFIG_RC.osUsername]: CONFIG_RC.secret },
    'challenge': true
  })
)


/*
 * DISABLE
 */
_Express.disable('x-powered-by')


/*
 * SERVER
 */
const _Async = async () => {
  // Local variable.
  let _Bree_

  // Execute pre hook before server starts.
  await Hook('preStart', Context)

  // Cron job handler.
  const jobs = []

  // Loop over cronjobs and push each job.
  for (const job of CronJobs) jobs.push({ 'name': job.name, 'path': job, 'cron': job.time })

  // Only initialize bree if jobs are available.
  if (!_.isEmpty(jobs)) {
    // Initialize bree manager for cron job.
    _Bree_ = new Bree({
      jobs,
      'root': Path.join(__dirname, '../../cron'),
      ErrorHandler(error, workerMetadata) {
        // Const assignment.
        const _functionName = 'Bree -> errorHandler'

        // Style guide.
        context.Debug({
          'message': `An error occurred in worker ${workerMetadata.name}:\n${error.stack}`,
          error
        }, _functionName)
      },
      workerMessageHandler(message) {
        // Const assignment.
        const _functionName = 'Bree -> workerMessageHandler'

        // Style guide.
        context.Debug({ message }, _functionName)
      }
    })

    // Start bree manager.
    await _Bree_.start()
  }

  // Execute server.
  _ExpressListener = _Express.listen(CONFIG_RC.httpPort, () => {
    // Const assignment.
    const _functionName = 'Www -> Http'

    // Style guide.
    context.Debug({ 'message': `Server running on ${CONFIG_RC.httpPort}` }, _functionName)

    // Execute post hook after server starts.
    return Hook('postStart', Context)
  })

  // Set a custom timeout (e.g., 30 minutes)
  _ExpressListener.setTimeout(30 * 60 * 1000)

  // Add bree to graceful.
  const _Graceful_ = new Graceful({
    'brees': [_.isEmpty(jobs) ? void 0 : _Bree_],
    'servers': [_ExpressListener],
    'redisClients': [_RedisClient],
    'customHandlers': [
      async () => {
        // Const assignment.
        const _functionName = 'Graceful -> customHandlers'

        // Style guide.
        context.Debug({ 'message': 'Graceful shutdown requested.' }, _functionName)

        // Execute pre hook before server starts.
        await Hook('preStop', Context)

        // Shutdown server.
        _ExpressListener?.close?.(async () => {
          // Const assignment.
          const _functionNameAgain = 'Graceful -> customHandlers'

          // Style guide.
          context.Debug({ 'message': 'Shutting down express server.' }, _functionNameAgain)

          // Execute post hook after server starts.
          await Hook('postStop', Context)
        })
      }
    ]
  })

  // Listen to graceful.
  _Graceful_.listen()
}


/*
 * EXPORTS
 */
module.exports = _Async
