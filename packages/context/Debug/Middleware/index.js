/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import Stringg from 'string' // Npm: string utility.
import Chokidar from 'chokidar' // Npm: file watcher Maps.
import isJSON from 'is-json' // Npm: checks for given object is json or not.
import Path from 'path' // Npm: path module.
import Tracey from 'stacktracey' // Npm: stack trace for error.
import ProjectRoot from 'app-root-path' // Npm: application root.


/*
 * EXPORTS
 */
export default function Middleware({ Debug }, { middlewares }, $options) {
  // Error handling.
  try {
    // Only work if called as constructor.
    if (this instanceof Middleware) {
      // Own properties.
      this.execution = new Map()
      this.handlers = new Map()
      this.Debug = Debug
      this.middlewares = middlewares ?? void 0

      // Configuration setup.
      this.configuration = {
        'watch': $options?.watch ?? void 0,
        'projectRoot': $options?.projectRoot ?? void 0
      }

      /*
       * Watch for directories.
       * and files in it with .error. pattern
       */
      if ($options && $options.watch) this.Chokidar()

      /*
       * OBJECT: MAIN.
       * Details: Main method of this constructor
       * which can be used across application without
       * recalling constructor.
       */
      this.Main = async (root, args, context, info, error) => {
        // Error handling [Middleware execution]
        try {
          /*
           * Remove spaces if given error message
           * is => based.
           */
          if (error && error.message && error.message.includes('=>')) error.message = error.message.replace(/\s/ug, '')

          /*
           * If middleware is present than
           * execute else return skip.
           * if middleware is available and server is not paused.
           */
          if (_.isArray(this.middlewares)) {
            // Error handling.
            try {
              // Local variable.
              let _DirectoryBasedErrorHandler

              // Style guide.
              await this.Debug({ 'message': 'Executing middleware' })

              /*
               * Execute handler's based on directory structure
               * and execute handler's.
               */
              _DirectoryBasedErrorHandler = await this.DirectoryBasedErrorHandler({ root, args, context, info, error })

              /*
               * If directory based error handling caught error
               * than report failure.
               */
              if (_DirectoryBasedErrorHandler instanceof Error && (
                _DirectoryBasedErrorHandler.name.includes('ReferenceError') || _DirectoryBasedErrorHandler.name.includes('SyntaxError') || _DirectoryBasedErrorHandler.name.includes('ValidationError') || _DirectoryBasedErrorHandler.name.includes('RangeError') || _DirectoryBasedErrorHandler.name.includes('TypeError') || _DirectoryBasedErrorHandler.name.includes('URIError')
              )) return _DirectoryBasedErrorHandler

              // Parse response based on graph information.
              if (!_.isEmpty(_DirectoryBasedErrorHandler) && info?.returnType.toString().includes('[') && info?.returnType.toString().includes(']')) {
                /*
                 * If given _Execute doesn't return
                 * array format than update _Execute
                 * as array response.
                 */
                if (!_.isArray(_DirectoryBasedErrorHandler)) _DirectoryBasedErrorHandler = [_DirectoryBasedErrorHandler]
              }

              /*
               * If middlewareExecution contains error
               * or wants to pause execution for returning message to user.
               */
              if (!_.isEmpty(_DirectoryBasedErrorHandler) || _.isObject(_DirectoryBasedErrorHandler)) return _DirectoryBasedErrorHandler

              // Loop over all middleware and map @_object: key to Configuration and get data to modify..
              for await (const value of this.middlewares) {
                // Local variable.
                let _Execute, _methodName

                // Only execute first level function's.
                if (!_.isFunction(value)) continue

                // Const assignment.
                const _ExecutionGetAnonymous = this.execution.get('anonymous')

                /*
                 * Get methodName from given function
                 * if given function is anonymous than convert
                 * it toString()
                 */
                if (_.isObject(this.middlewares[this.middlewares.indexOf(value)]) && !_.isFunction(this.middlewares[this.middlewares.indexOf(value)])) {
                  // Get method name.
                  _methodName = _.first(_.keys(this.middlewares[this.middlewares.indexOf(value)]))
                } else {
                  // Get method name.
                  _methodName = value.name ?? value.toString()
                }

                /*
                 * Execute middleware. if execution caught exception
                 * than report failure.
                 */
                _Execute = await this.Execute(value, { root, args, context, info, error })

                // Parse response based on graph information.
                if (!_.isEmpty(_Execute) && info?.returnType.toString().includes('[') && info?.returnType.toString().includes(']')) {
                  /*
                   * If given _Execute doesn't return
                   * array format than update _Execute
                   * as array response.
                   */
                  if (!_.isArray(_Execute)) _Execute = [_Execute]
                }

                /*
                 * If _Execute is Reference, Syntax or Validation
                 * Error than report failure.
                 */
                if (_Execute instanceof Error && (
                  _Execute.name.includes('ReferenceError') || _Execute.name.includes('SyntaxError') || _Execute.name.includes('ValidationError') || _Execute.name.includes('RangeError') || _Execute.name.includes('TypeError') || _Execute.name.includes('URIError')
                )) return _Execute

                /*
                 * Only push values if _Execute is not error.
                 * else skip adding execution.
                 */
                if (!(_Execute instanceof Error)) {
                  // Update execution return.
                  _.isEmpty(_methodName) ? this.execution.set('anonymous', _ExecutionGetAnonymous && _.isArray(_ExecutionGetAnonymous) ? _ExecutionGetAnonymous.push(_Execute) : [_Execute]) : this.execution.set(_methodName, _Execute)

                  /*
                   * If middlewareExecution contains error
                   * than report failure else continue.
                   */
                  if (!_.isEmpty(_Execute) && _.isObject(_Execute)) return _Execute
                }
              }

              // Update configuration's.
              return this.execution
            } catch (errorr) {
              // Report failure.
              return errorr
            }

            // Report failure.
          } else { return this.Debug({ 'message': 'Skipping Middleware. middlewares not defined.', 'state': 'successful' }) }
        } catch (errorr) {
          // Report failure.
          return errorr
        }
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
Middleware.prototype = {
  // Own properties.
  'name': 'Middleware',

  /*
   * Execution handler for executing.
   * method's.
   */
  'Execute': function(value, { root, args, context, info, error }) {
    // Error handling.
    try {
      // Const assignment.
      const _problem = error && error.message.includes('=>') ? error.message.split('__')[1] : error && error.message ? error.message : 'ERROR_____NOT_____DEFINED'

      // Only run middleware when provided as module export. or module from middleware directory.
      if (_.isFunction(value)) return value({ root, args, context, info, error })
      if (_.isObject(value) && !_.isFunction(value) && isJSON(value, true)) {
        // Const assignment.
        const _methodName = Stringg(_problem).between('(', ')').s

        /*
         * Get method name if available.
         * and check errorList for errors.
         */
        if (value && value[_methodName]) {
          // Variable assignment.
          let _errorCaught

          // Variable assignment.
          _errorCaught = void 0

          /*
           * Loop over _errorList[_methodName] and find out
           * matching error.
           */
          Object.entries(value[_methodName]).forEach(v => _problem.includes(v[0]) ? _errorCaught = {
            'message': v[1],
            'status': v[0]
          } : void 0)

          // Report failure.
          return _errorCaught
        } else if (value && value[_problem]) {
          // Report failure.
          return {
            'message': value[_problem],
            'status': _problem
          }
        }

        // Report failure.
        return void 0
      }

      // Report failure.
      return void 0
    } catch (errorr) {
      // Report failure.
      return errorr
    }
  },
  'DirectoryBasedErrorHandler': async function({ root, args, context, info, error }) {
    // Error handling.
    try {
      // Local variable.
      let _field

      // Variable assignment.
      _field = info?.fieldName

      // Const assignment.
      const _errorHandlerName = error.message.includes('=>') || error.message.includes('__') ? await this.Module.name.FromErrorPattern(error) : await this.Module.name.Tracey(error, this.configuration.watch)

      /*
       * If _errorHandlerName is not empty
       * try handling error try considering
       * name as fieldName.
       */
      if ((((((((((((((((((/[A-Z]/u))))))))))))))))).test(_errorHandlerName)) _field = _errorHandlerName
      if ((((((((((((((((((/(\w+)$/u))))))))))))))))).test(_errorHandlerName)) _field = ((((((((((((((((((/(\w+)$/u))))))))))))))))).exec(_errorHandlerName))[0]

      /*
       * Return execution if handler for
       * given fieldName is found in container.
       */
      if (this.handlers.has(_field)) return this.Execute(this.handlers.get(_field.replace(String.toCapitalize(this.configuration.projectRoot.replace('/', '')), '').replace(/ /gu, '')), { root, args, context, error, info })

      // Report void 0.
      return void 0
    } catch (errorr) {
      // Report failure.
      return errorr
    }
  },

  /*
   * Module object for handling.
   * module level manipulations.
   */
  'Module': {
    'name': {
      'Builder': async __path => {
        // Error handling.
        try {
          /*
           * Only proceed if __path is defined else
           * report failure.
           */
          if (!_.isEmpty(__path)) {
            // Local variable.
            let _path, _pathClone, _return

            // Object assignment.
            const Slash = ___path => {
              // Check if given path is of windows or not.
              const isExtendedLengthPath = (/^\\\\\?\\/u).test(___path)

              // If is then return path as is.
              if (isExtendedLengthPath) {
                // Return path.
                return ___path
              }

              // Else replace all \\ with /
              return ___path.replace(/\\/ug, '/')
            }

            // Variable re-assignment.
            _path = __path.trim()
            _path = Slash(_path)
            _pathClone = _path

            // Const assignment.
            const _fileName = _path.replace(/^.*[\\/]/u, '')
            const _type = (((((((((((((((((/(__mutation__|__subscription__|__resolver__|__directive__|__scalar__)/u))))))))))))))))).exec(_path)

            /*
             * Before chopping down path check if given path
             * is module than try to get name property of module.
             */
            if (_.isString(_path) && _path.includes('.js')) {
              // Const assignment.
              const _loadModule = await import(Path.resolve(ProjectRoot.path, _path))

              // If _loadModule is function than only continue..
              if (_.isFunction(_loadModule)) {
                // Check for name property if found than return it.
                if (!_.isEmpty(_loadModule.name)) return _loadModule.name
              }
            }

            /*
             * If path contains fileName other than
             * index.js than return fileName as method name.
             */
            if (_fileName.includes('.js') && (!_fileName.includes('.error.js') && !_fileName.includes('index.js'))) return Stringg(_fileName.replace('.js', '')).capitalize().s

            /*
             * Remove first directory from path
             * as it is expected that handlers will
             * going to be in first directory contain
             * it.
             */
            _pathClone = _pathClone.split('/').splice(1, _path.length).join('/')

            /*
             * If path includes index.js than get
             * directory name as method name.
             */
            if ((_fileName.includes('.error.js') || _fileName.includes('index.js')) && !_.isEmpty(_type)) {
              // Return module name.
              _return = _pathClone.replace(_fileName, '').split('/').join('').replace(/ /gu, '').replace('__', '')

              /*
               * Else return directory path as
               * module name.
               */
            } else if ((_fileName.includes('.error.js') || _fileName.includes('index.js')) && _.isEmpty(_type)) {
              // Assign module name.
              _return = _pathClone.split('/').slice(0, -1).join('')
            } else {
              // Assign path as is.
              _return = _path
            }

            // Return path as.
            return Stringg(_return).capitalize().s
          }

          // Report failure.
          return new Error('Builder expected path for building module name but got undefined.')
        } catch (error) {
          // Report failure.
          return error
        }
      },
      'FromErrorPattern': error => {
        // Error handling.
        try {
          /*
           * Only proceed if error
           * is instanceof Error.
           */
          if (error && error instanceof Error && error.message.includes('=>')) {
            // Variable assignment.
            const _errorMessage = error.message

            /*
             * Only proceed if error message
             * is not empty.
             */
            if (_errorMessage && _.isString(_errorMessage)) {
              // Const assignment.
              const _splitByReturn = (_errorMessage.split('=>').join('').split('__'))[0]

              /*
               * Consider first part as name of methods
               * executing.
               */
              if (_splitByReturn.includes('=>')) {
                /*
                 * Split string by =>. as => connects two
                 * method name.
                 */
                return Stringg(_splitByReturn.split('=>').join('').replace(/ /gu, '')).capitalize().s
              }

              // Else return first part as name.
              return Stringg(_splitByReturn).capitalize().s
            }

            // Report failure.
            return new Error('FromErrorPattern expected error object but found undefined.')
          }

          // Report failure.
          return new Error('FromErrorPattern pattern check failed for given object')
        } catch (errorr) {
          // Report failure.
          return errorr
        }
      },
      'Tracey': (error, __watchDirectories) => {
        // Error handling.
        try {
          /*
           * Only proceed if error is defined and __watchDirectories
           * are passed to.
           */
          if (error instanceof Error && !_.isEmpty(__watchDirectories)) {
            // Local variable
            let _path

            // Const assignment.
            const _Tracey = new Tracey(error)

            // Variable assignment.
            _path = _.isObject(_Tracey) && _Tracey?.items ? _Tracey?.items?.[0].file : void 0

            /*
             * Sanitize path by removing anything
             * before watch directory paths.
             */
            if (__watchDirectories) {
              /*
               * Loop over watch and remove
               * anything from start to watch
               * directory path.
               */
              for (const aisha of __watchDirectories) {
                /*
                 * If current directory is found in
                 * given path.
                 */
                if (_path.includes(aisha)) {
                  // Remove from start till aisha.
                  _path = _path.split(aisha)[1]
                  _path = Path.join(aisha, _path)

                  // Break for only single change.
                  break
                }
              }
            }

            // Return directoryName.
            return Middleware.prototype.Module.name.Builder(_path)
          }

          // Report failure.
          return new Error('Tracey expected error and watch directories but found undefined.')
        } catch (errorr) {
          // Report failure.
          return errorr
        }
      }
    }
  },

  /*
   * Chokidar for watching over directories.
   * and update each method exported.
   */
  'Chokidar': function() {
    // Error handler.
    try {
      // Const assignment.
      const _this_ = this

      // Return watch.
      return Chokidar.watch(_this_.configuration.watch, {
        'persistent': true,
        'ignored': ['node_modules', 'build'],
        'ignoreInitial': false,
        'followSymlinks': true,
        'cwd': ProjectRoot.path,
        'disableGlobbing': true,
        'usePolling': true,
        'interval': 100,
        'binaryInterval': 300,
        'alwaysStat': false,
        'depth': 99,
        'awaitWriteFinish': {
          'stabilityThreshold': 2000,
          'pollInterval': 100
        },
        'ignorePermissionErrors': false,
        'atomic': true
      }).on('all', async (__, __path) => {
        /*
         * If given path matches to
         * error file regex than load
         * error handler from memory.
         */
        if (((/.error.json/u)).test(__path) || ((/.error.json/u)).test(__path)) {
          // Import given module from given path.
          const _Module = require(Path.resolve(ProjectRoot.path, __path))

          /*
           * If _Module is instanceof Error
           * than report failure.
           */
          if (_Module instanceof Error) return _Module

          // Build moduleName from path.
          const _moduleName = await _this_.Module.name.Builder(__path)

          /*
           * If _moduleName contains error than
           * report failure.
           */
          if (_moduleName instanceof Error) return _moduleName

          // Update handlers.
          return _this_.handlers.set(_moduleName, _Module)
        }

        // Return void.
        return void 0
      })
    } catch (error) {
      // Report failure.
      return error
    }
  }
}
