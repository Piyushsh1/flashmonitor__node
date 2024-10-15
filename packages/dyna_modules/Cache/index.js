/*
 * IMPORTS
 */
import Graceful from '@ladjs/graceful' // Npm: graceful shutdown.
import Lo from 'lodash' // Npm: utility module.
import Redis from 'ioredis' // Npm: redis cache manager.
import CircularFix from 'circular-json-es6' // Npm: circular reference fix Maps.
import Ms from 'ms' // Npm: ms Maps.
import Interval from 'interval-promise' // Npm: interval promise library.
import _ from 'underscore' // Npm: utility module.
import { promisify } from 'util' // Npm: utility Maps.


/*
 * GLOBALS
 */
const Client = new Redis({
  'connectTimeout': 10000,
  'maxRetriesPerRequest': 3,
  'enableOfflineQueue': true,
  'retry_strategy': __options => {
    if ('ECONNREFUSED' === __options.error.code) {
      /*
       * This will suppress the ECONNREFUSED unhandled exception
       * that results in app crash
       */
      return void 0
    }

    // Return reconnect.
    return __options
  }
})
const GetAsync = promisify(Client.get).bind(Client)
const Hset = promisify(Client.hset).bind(Client)
const Zadd = promisify(Client.zadd).bind(Client)
const Zrange = promisify(Client.zrange).bind(Client)
const Zrevrangebyscore = promisify(Client.zrevrangebyscore).bind(Client)


/*
 * EXPORTS
 */
export default function Cache({ id, whatToCache, cb }, $options) {
  // Error handling.
  try {
    // Only work if called as constructor.
    if (this instanceof Cache) {
      // Update properties
      this.name = Cache.prototype.name
      this.Pubsub = Client.duplicate()
      this.HSET = Hset
      this.ZADD = Zadd
      this.ZRANGE = Zrange
      this.ZREVRANGEBYSCORE = Zrevrangebyscore

      // Configuration setup.
      this.configuration = {
        'merge': $options?.merge ?? false,
        'expireIn': $options?.expireIn ?? void 0,
        'upsert': $options?.upsert ?? false,
        'assign': $options?.assign ?? false,
        'changeTo': $options?.changeTo ?? false,
        'delete': $options?.delete ?? false,
        'hm': {
          'count': $options?.count ?? 10,
          'delete': $options?.delete ?? false,
          'keys': $options?.keys ?? true
        }
      }

      /*
       * Return cache as instance instead
       * of handler execution
       */
      if ($options?.instance) return this

      /*
       * If match is provided than scan
       * redis for matching keys and return
       * result.
       */
      if (id && id.includes('*')) {
        // Return hm.
        return this.hm({ id, cb })
      } else if (whatToCache) {
        // Return cache set.
        return this.set({ id, whatToCache })
      } else if (id && this.configuration.delete) {
        // Return removed key.
        return Client.del(id)
      }

      // Else return get
      return this.get(id)
    }

    // Report failure.
    return new Error('NOT__CONSTRUCTOR')
  } catch (error) {
    // Report failure.
    return error
  }
}


/*
 * PROTOTYPE
 */
Cache.prototype = {
  // Properties.
  'name': 'Cache',

  // Setter for setting values to cache.
  async set({ id, whatToCache }, $options = {}) {
    // Error handling.
    try {
      // Local variable.
      let _Cache, _dataContainer, _oldData

      // If whatToCache and key is not empty.
      if (!_.isEmpty(id) && _.isString(id)) {
        /*
         * Check if data already exist.
         * if exist than merge old data
         * with new data.
         */
        _oldData = await this.get(id)

        /*
         * Parse old data if is valid json
         * else continue with whatToCache alone.
         */
        if (_oldData) {
          /*
           * Change type for type if given merge
           * is type of [] || {}
           */
          if (this.configuration.changeTo === Array) {
            // Local variable.
            let _newObjectToStore

            /*
             * Convert to iterable object
             * only if _oldData is not iterable.
             */
            if (!_.isArray(_oldData)) {
              // Variable assignment.
              _newObjectToStore = [_oldData, whatToCache]

              // Extend if is array type.
            } else if (_.isArray(_oldData)) { _oldData.push(whatToCache) }

            // Extend old type with array.
            _dataContainer = _.compact(_newObjectToStore || _oldData)

            /*
             * Set key expire if expireIn is passed
             * for each object.
             */
            if (this.configuration && this.configuration.expireIn) {
              /*
               * Set timer for given key with clearTimeout
               * when key expires.
               */
              Interval(async (__number, __stop) => {
                // Const assignment.
                const _getDetails = await GetAsync(id)

                /*
                 * If getting result caught error
                 * than report failure.
                 */
                if (_getDetails instanceof Error) return _getDetails

                // Variable assignment.
                const _dataContainerToChange = CircularFix.parse(_getDetails)

                // Shift for removing data from start.
                _dataContainerToChange.shift()

                // Set new updates.
                await Client.set(id, CircularFix.stringify(_dataContainerToChange))

                // Clear timer only if _dataContainer is empty.
                _.isEmpty(_dataContainerToChange) ? __stop() : void 0

                // Return promise.
                return Promise.resolve('done')
              }, Ms(this.configuration.expireIn), { 'stopOnError': true }).catch(error => { throw error })
            }
          } else if (this.configuration.merge) {
            if (_.isObject(_oldData) && _.isObject(whatToCache)) {
              // Update new Data.
              _dataContainer = Lo.merge(_oldData, whatToCache)

              // Report failure.
            } else { return new Error('DIFFERENT_MERGE_TYPE(SET)') }

            // Cache only given data
          } else if (this.configuration.upsert) {
            // Return _old data.
            return _oldData

            // Update whatToCache only
          } else if (this.configuration.assign) {
            // Object merge.
            if (_.isObject(_oldData) && _.isObject(whatToCache)) {
              // Assign new data with old.
              _dataContainer = Object.assign(_oldData, whatToCache)

              // Report failure.
            } else { return new Error('DIFFERENT_MERGE_TYPE(SET)') }

            // Discard saving with old data
          } else { _dataContainer = whatToCache }

          /*
           * Cache only don't merge or do
           * anything with previously stored
           * data
           */
        } else { _dataContainer = this.configuration.changeTo === Array ? [whatToCache] : whatToCache }


        // Only proceed if data container is not empty.
        if (_.isEmpty(_dataContainer)) return new Error('EMPTY_DATA_CONTAINER(SET)')

        /*
         * Loop over value and store each thing one by one.
         * map data to Redis manager.
         */
        _Cache = await Client.set(id, CircularFix.stringify(_dataContainer))

        // Expire key after given ms.
        if (!this.configuration.changeTo && this.configuration.expireIn) await Client.pexpire(id, Ms(this.configuration.expireIn))
        if ($options.expireIn) await Client.pexpire(id, Ms($options.expireIn))

        // If redis set doesn't contain any error.
        if (!(_Cache instanceof Error)) {
          // Const assignment.
          const _getStoredData = await this.get(id)

          /*
           * If _getStoredData is instanceof Error
           * than report failure.
           */
          if (_getStoredData instanceof Error) return _getStoredData

          // Return _dataContainer.
          return _getStoredData
        }

        // Report failure.
        return _Cache
      }

      // Report failure.
      return new Error('REQUIRE_ID(SET)')
    } catch (error) {
      // Report failure.
      return error
    }
  },

  /*
   * Getter for getting key values from
   * cache.
   */
  async get(id) {
    // Error handling.
    try {
      /*
       * Only proceed if id is passed else
       * report failure.
       */
      if (!_.isEmpty(id)) {
        // Get cache belonging to given id
        const _getDetails = await GetAsync(id)

        /*
         * If getting result caught error
         * than report failure.
         */
        if (_getDetails instanceof Error) return _getDetails

        // Return parsed result.
        return CircularFix.parse(_getDetails)
      }

      // Report failure.
      return new Error('REQUIRE_ID(GET)')
    } catch (error) {
      // Report failure.
      return error
    }
  },

  /*
   * Hm handler for handling
   * hash Maps or key with matching
   * patterns.
   */
  hm({ id, cb, count, skip, take }) {
    // Error handling.
    try {
      /*
       * Only proceed if id is passed else
       * report failure.
       */
      if (!_.isEmpty(id)) {
        // Local variable.
        let _return

        // Const assignment.
        const _this_ = this

        // Variable assignment.
        _return = []

        // Return promise.
        return new Promise((__resolve, __reject) => Client.scanStream({ 'match': id, 'count': count ?? _this_.configuration.hm.count ?? 100000 }).on('data', __data => {
          /*
           * Only create client.pipeline
           * if $options?.keys is not set to true
           * if so than return __data as is.
           */
          if (!_this_.configuration.hm.keys) {
            // Const assignment.
            const _BatchGet = Client.pipeline()

            // Skip and take on the __data.
            __data = __data.slice(skip ?? 0, take ?? __data.length)

            /*
             * If __data is array and is not
             * empty than queue all get.
             */
            if (_.isArray(__data) && !_.isEmpty(__data)) {
              // Queue all get.
              for (const i of __data) {
                // Batch each get.
                _this_.configuration.hm.delete ? _BatchGet.del(i) : _BatchGet.get(i)
              }
            }

            // Batch import.
            return _BatchGet.exec((error, __result) => {
              /*
               * If error than report
               * failure.
               */
              if (error) __reject(error)

              /*
               * Only flatten and parse result
               * if given set is not array.
               */
              if (!_.isEmpty(__result)) {
                // Const assignment.
                const _result = _.compact(Lo.flatten(__result))

                /*
                 * Update each result set with
                 * parsed data.
                 */
                for (const i in _result) {
                  // Has own property check and parse data.
                  if (_result.hasOwnProperty(i) && !_.isEmpty(_result[i]) && _.isString(_result[i])) _return.push(JSON.parse(_result[i]))
                }
              }
            })
          }

          // Update data to return.
          _return = __data

          // Resolve batch
          return _.isFunction(cb) ? cb(_return) : __resolve(_return)
        }))
      }

      // Report failure.
      return new Error('REQUIRE_ID(HM)')
    } catch (error) {
      // Report failure.
      return error
    }
  },

  /*
   * Delete handler for deleting
   * key values from cache.
   */
  async delete(id) {
    // Error handling.
    try {
      /*
       * Only proceed if id is passed else
       * report failure.
       */
      if (!_.isEmpty(id)) {
        // Delete key from cache.
        const _Cache = await Client.del(id)

        // Return result.
        return _Cache
      }

      // Report failure.
      return new Error('REQUIRE_ID(DELETE)')
    } catch (error) {
      // Report failure.
      return error
    }
  }
}


/*
 * GRACEFUL
 */
const _Graceful_ = new Graceful({ 'redisClients': [Client] })

// Listen to graceful.
_Graceful_.listen()
