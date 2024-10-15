/*
 * IMPORTS
 */
import Moment from 'moment' // Npm: moment for date and time manipulation.
import JsonWebToken from 'jsonwebtoken' // Npm: json web token Maps.
import _ from 'underscore' // Npm; utility module.


/*
 * PACKAGES
 */
import { context } from '../'
import Tag from 'tag'


/*
 * EXPORTS
 */
export default async function Session({ name, request }) {
  // Error handling.
  try {
    // Only work if called as constructor.
    if (this instanceof Session) {
      // Const assignment.
      const _functionName = 'Context -> Session'

      // Properties assignment.
      this.name = name ? name.toCapitalize() : Session.prototype.name
      this.user = null
      this.token = null
      this.runtimeCleanupPeriod = 2000
      this.ip = request?.headers?.['x-forwarded-for'] || request?.socket?.remoteAddress
      this.isLoggedIn = false
      this.headers = request?.headers?.headersInit

      /*
       * Only proceed if context is defined
       * else report failure.
       */
      if (!context || (context && !context.isContext)) return new Error('MISSING__CONTEXT')

      /*
       * Only proceed if headers authorization is provided
       * else report failure.
       */
      if (this.headers && _.isEmpty(this.headers['s-authorization']) && !_.isEmpty(this.headers['l-authorization']) && 'undefined' !== this.headers['l-authorization']) {
        // Style guide.
        context.Debug({ 'message': 'Found l-authorization header. Verifying token.' }, _functionName)

        // Const assignment.
        const _JwtVerify = await this.JwtVerify(this.headers['l-authorization'])

        /*
         * Verify given jwt if is
         * valid token or not.
         */
        if (_JwtVerify && _JwtVerify instanceof Error) {
          // Style guide.
          context.Debug({ 'message': 'Token verification failed.' }, _functionName)

          // Report failure.
          return _JwtVerify
        }

        // Style guide.
        context.Debug({ 'message': 'Token verification successful.' }, _functionName)

        /*
         * Update instance with
         * session detail's.
         */
        this.user = _JwtVerify
        this.token = this.headers['l-authorization']
        this.isLoggedIn = true
        this.isSystem = false
      }
      if (this.headers && !_.isEmpty(this.headers['s-authorization']) && _.isEmpty(this.headers['l-authorization']) && 'undefined' !== this.headers['s-authorization']) {
        // Style guide.
        context.Debug({ 'message': 'Found s-authorization header. Verifying token.' }, _functionName)

        // Const assignment.
        const _JwtVerify = await this.JwtVerify(this.headers['s-authorization'], true)

        /*
         * Verify given jwt if is
         * valid token or not.
         */
        if (_JwtVerify && _JwtVerify instanceof Error) {
          // Style guide.
          context.Debug({ 'message': 'Token verification failed.' }, _functionName)

          // Report failure.
          return _JwtVerify
        }

        // Style guide.
        context.Debug({ 'message': 'Token verification successful.' }, _functionName)

        /*
         * Update instance with
         * session detail's.
         */
        this.user = _JwtVerify
        this.token = this.headers['g-authorization']
        this.isSystem = true
        this.isLoggedIn = true
      }

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
 * PROTOTYPE
 */
Session.prototype = {
  // Properties.
  'name': 'Session',
  'configuration': {
    'expireIn': '6 day',
    'expireInProto': { 'day': 6, 'type': 'day' },
    'secret': CONFIG_RC.secret ?? '1Singleshot'
  },


  /*
   * Kill deletes given session from user
   * session container.
   */
  'Kill': async function Kill(__param) {
    // Error handling.
    try {
      /*
       * If given __param is not empty than only continue
       * else report failure.
       */
      if (!_.isEmpty(__param)) {
        // Local variable.
        let _Cache

        // Const assignment.
        const _functionName = 'Context -> Session -> Kill'

        // Style guide.
        context.Debug({ 'message': 'Removing token from cache.' }, _functionName)

        // Variable assignment.
        _Cache = await this.Cache({ 'id': __param })

        /*
         * Only proceed if userSession is not
         * empty else report failure.
         */
        if (_.isArray(_Cache) && _Cache.includes(this.token)) {
          // Style guide.
          context.Debug({ 'message': 'Token found in cache. Removing token.' }, _functionName)

          // Remove token if found
          _Cache = _.without(_Cache, this.token)

          // Style guide.
          context.Debug({ 'message': 'Token removed from cache.' }, _functionName)

          // Report failure.
        } else if (_.isString(_Cache)) {
          // Update null as removing token.
          _Cache = []

          // Style guide.
          context.Debug({ 'message': 'Token found in cache. Removing token.' }, _functionName)
        } else {
          // Style guide.
          context.Debug({ 'message': 'Token not found in cache.' }, _functionName)

          // Report failure.
          return new Error('REQUIRE__LOGIN')
        }

        // Style guide.
        context.Debug({ 'message': 'Updating cache.' }, _functionName)

        /*
         * Remove client auth from Auth
         * and return Cache
         */
        const _CacheUpdate = await this.Cache({ 'id': __param, 'whatToCache': _Cache }, { 'save': true })

        /*
         * If updateUserAuth is not empty
         * and doesn't contain error.
         */
        if (!(_CacheUpdate instanceof Error)) {
          // Update prototype
          this.isLoggedIn = false

          // Style guide.
          context.Debug({ 'message': 'Cache update failed.' }, _functionName)

          // Resolve done.
          return true
        }

        // Style guide.
        context.Debug({ 'message': 'Cache updated.' }, _functionName)

        // Report failure.
        return _CacheUpdate
      }

      // Report failure.
      return new Error('EXPECTED_PARAM(KILL)')
    } catch (error) {
      // Report failure.
      return error
    }
  },


  /*
   * Jwt handler for handling jwt
   * token's etc.
   */
  async JwtSign(__param) {
    // Error handling.
    try {
      /*
       * Only proceed if __param is passed for signing
       * else report failure.
       */
      if (!_.isEmpty(__param)) {
        // Const assignment.
        const _functionName = 'Context -> Session -> JwtSign'

        // Style guide.
        context.Debug({ 'message': 'Signing token.' }, _functionName)

        // Sign toke and update cache.
        const _JwtSign = JsonWebToken.sign(__param, Session.prototype.configuration.secret, {
          'expiresIn': Session.prototype.configuration.expireIn
        })

        /*
         * Signing token caught exception than
         * report failure.
         */
        if (_JwtSign && _JwtSign instanceof Error) {
          // Style guide.
          context.Debug({ 'message': 'Token signing failed.' }, _functionName)

          // Report failure.
          return _JwtSign
        }

        // Style guide.
        context.Debug({ 'message': 'Token signing successful.' }, _functionName)

        // Cache new signed token.
        const _Cache = await Session.prototype.Cache(
          {
            'id': __param.id,
            'whatToCache': _JwtSign
          },
          {
            'changeTo': Array,
            'expireIn': Session.prototype.configuration.expireIn,
            'save': true
          }
        )

        // On successful cacheUpdate return token to client.
        if (_.isEmpty(_Cache) || (_Cache instanceof Error)) {
          // Style guide.
          context.Debug({ 'message': 'Token caching failed.' }, _functionName)

          // Report failure.
          return _Cache instanceof Error ? _Cache : new Error('EXPECTED_CACHE(SIGN)')
        }

        // Style guide.
        context.Debug({ 'message': 'Token caching successful.' }, _functionName)

        // Report failure.
        return _JwtSign
      }

      // Report failure.
      return new Error('EXPECTED_PARAM(SIGN)')
    } catch (error) {
      // Report failure.
      return error
    }
  },
  async JwtVerify(__param, __skipCacheVerify = false) {
    // Error handling.
    try {
      /*
       * Only proceed if param is passed else
       * report failure.
       */
      if (!_.isEmpty(__param)) {
        // Const assignment.
        const _functionName = 'Context -> Session -> JwtVerify'
        const _this_ = this

        // Style guide.
        context.Debug({ 'message': 'Verifying token.' }, _functionName)

        // Const assignment.
        const _JwtVerify = await JsonWebToken.verify(__param, Session.prototype.configuration.secret)

        /*
         * If _jwtVerify contains error
         * than report failure else return
         */
        if (!_.isEmpty(_JwtVerify) && !(_JwtVerify instanceof Error) && !__skipCacheVerify) {
          // Style guide.
          context.Debug({ 'message': 'Token verification successful.' }, _functionName)
          context.Debug({ 'message': 'Verifying token from cache.' }, _functionName)

          // Fetch token from cache.
          const _Cache = await _this_.Cache({ 'id': _JwtVerify.id })

          /*
           * Only proceed if user session cache is
           * not empty or is not instanceof Error.
           */
          if (_Cache && _Cache instanceof Error) {
            // Style guide.
            context.Debug({ 'message': 'Token verification failed.' }, _functionName)

            // Report failure.
            return _Cache
          }

          /*
           * Only validate to true
           * if token is present in cache.
           */
          if (_.isArray(_Cache) && _Cache.includes(__param)) {
            // Style guide.
            context.Debug({ 'message': 'Token verification successful.' }, _functionName)

            // Return token details.
            return _JwtVerify

            // If given token is string
          } else if (_.isString(_Cache) && _Cache === __param) {
            // Style guide.
            context.Debug({ 'message': 'Token verification successful.' }, _functionName)

            // Return token details.
            return _JwtVerify
          }

          // Style guide.
          context.Debug({ 'message': 'Token verification failed.' }, _functionName)

          // Report failure.
          return new Error('NOT_FOUND(VERIFY)')
        }

        // If skip cache verification is true then return token.
        if (__skipCacheVerify) return _JwtVerify

        // Style guide.
        context.Debug({ 'message': 'Token verification failed.' }, _functionName)

        // Report failure.
        return _JwtVerify instanceof Error ? _JwtVerify : new Error('EXPECTED_JWT(VERIFY)')
      }

      // Report failure.
      return new Error('EXPECTED_PARAM(VERIFY)')
    } catch (error) {
      // Report failure.
      return error
    }
  },


  /*
   * Cache handler for caching session
   * and other details.
   */
  'Cache': function({ id, whatToCache }, $options) {
    // Return cache for given id.
    return $options && $options.save ? context.Cache.set({ 'id': Tag.Session.cache(id), whatToCache }, $options) : context.Cache.get(Tag.Session.cache(id))
  }
}
