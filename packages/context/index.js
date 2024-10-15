/*
 * IMPORTS
 */
import Graceful from '@ladjs/graceful' // Npm: graceful shutdown.
import Redis from 'ioredis' // Npm: redis library.
import _ from 'underscore' // Npm: utility module.
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store' // Npm: live query.
import { createPubSub } from 'graphql-yoga' // Npm: graphql subscriptions.
import { execute, parse } from 'graphql' // Npm: graphql execute.
import { PrismaClient as PrismaClientPostgres } from '@prisma/client' // Npm: prisma client for database.
import { createPrismaRedisCache } from 'prisma-redis-middleware' // Npm: Prisma redis cache.


/*
 * PACKAGES
 */
import Router from '../routes'


/*
 * SIBLINGS
 */
import Debug from './Debug'
import Session from './Session'
import Cache from 'servercache'


/*
 * REQUIRE
 */
const Utility = require('./Utility')


/*
 * GLOBALS
 */
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
const _Debug = new Debug({ 'watch': ['packages/routes/', 'packages/dyna_modules/', 'packages/middleware/'], 'showLog': WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env })
const _CreatePubsub = createPubSub()
const _CacheMiddleware = createPrismaRedisCache({
  'storage': { 'type': 'redis', 'options': { 'client': _RedisClient, 'invalidation': true, 'log': false } },
  'cacheTime': 5
})
const _PrismaPostgresClient = new PrismaClientPostgres({
  'omit': {
    'account': {
      'password': true
    }
  },
  'log': [
    {
      'emit': 'event',
      'level': 'query'
    },
    {
      'emit': 'stdout',
      'level': 'error'
    },
    {
      'emit': 'stdout',
      'level': 'info'
    },
    {
      'emit': 'stdout',
      'level': 'warn'
    }
  ]
})
const _LiveQueryStore = new InMemoryLiveQueryStore()
const _Cache = new Cache({}, { 'instance': true })

// FIX: Prisma client slow fix.
_PrismaPostgresClient[Symbol.for('nodejs.util.inspect.custom')] = 'PrismaClient'
_PrismaPostgresClient.$use(_CacheMiddleware)
_PrismaPostgresClient.$use((params, next) => {
  /*
   * Check if prisma action is set to delete
   * something then soft delete those items.
   */
  if ('delete' === params.action) {
    // Update query.
    params.action = 'update'
    params.args.data = { 'isDeleted': true }
  }
  if ('deleteMany' === params.action) {
    // Delete many queries
    params.action = 'updateMany'
    if (null === params.args.data) {
      params.args.data = { 'isDeleted': true }
    } else {
      // If data is empty then set isDeleted to true.
      if (_.isEmpty(params.args.data)) params.args.data = {}

      // Update properties.
      params.args.data.isDeleted = true
    }
  }
  if ('findUnique' === params.action) {
    // Find unique queries
    if (null === params.args.where) {
      params.args.where = { 'isDeleted': false }
    } else {
      params.args.where.isDeleted = false
    }
  }
  if ('findMany' === params.action) {
    // Find many queries
    if (null === params.args.where) {
      params.args.where = { 'isDeleted': false }
    } else {
      params.args.where.isDeleted = false
    }
  }

  // Return query.
  return next(params)
})


// Const assignment.
const context = {
  'isContext': true,
  'host': CONFIG_RC.host,
  'Debug': _.extend(_Debug.Main, _.omit(_Debug, 'Main')),
  'Pubsub': _CreatePubsub,
  'DataBase': _PrismaPostgresClient,
  'Utility': Utility,
  'LiveStore': _LiveQueryStore,
  'Cache': _Cache
}
const ExecuteGraph = (__query, __variables, __context) => execute({ 'schema': Router, 'document': parse(__query), 'contextValue': Object.assign(context, __context), 'variableValues': __variables })

// Assign base properties.
Object.assign(context, { 'ExecuteGraph': ExecuteGraph })


/**
 * Creates a context object for the application.
 * @param {Object} options - The options for creating the context.
 * @param {Object} options.request - The request object.
 * @returns {Promise<Object>} The context object.
 */
const Context = async ({ request = { 'headers': {} } }) => {
  // Check request session.
  const _Session_ = await new Session({ 'request': request })

  /*
   * Only return _Session_ if return is
   * not instanceof Error.
   */
  if (_Session_ && ('TokenExpiredError' === _Session_.name || _Session_ instanceof Error)) throw _Session_
  else Object.assign(context, { 'Session': _Session_ })

  // Return context with server.
  return context
}


/*
 * GRACEFUL
 */
const _Graceful_ = new Graceful({
  'customHandlers': [
    async () => {
      // Style guide.
      context.Debug({ 'message': 'Disconnecting all of the connections of context.' })

      // Disconnect prisma.
      await _PrismaPostgresClient.$disconnect()

      // Style guide.
      return context.Debug({ 'message': 'Successfully disconnected the context from everything.' })
    }
  ]
})


/*
 * LISTENERS
 */
_PrismaPostgresClient.$on('query', e => {
  // Log only if debug is enabled.
  if (WORKING_ENV.DEVELOPMENT.value === CONFIG_RC.env) {
    // Only log long queries.
    if (1000 < e.duration) {
      // Style guide.
      context.Debug({ 'message': 'Long running query found. kindly fix following query.' })
      context.Debug({ 'message': `Long query which need to be fixed. current duration: ${e.duration}ms` })
      context.Debug({ 'message': e.query })
      context.Debug({ 'message': e.params })
    }
  }
})
_Graceful_.listen()


/*
 * EXPORTS
 */
export { context, ExecuteGraph }
export default Context
export const LiveStore = _LiveQueryStore
