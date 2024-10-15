/*
 * IMPORTS
 */
const __Debug = require('debug') // Npm: debug library.


/*
 * REGISTER
 */
require('enum').register()
require('app-root-path').setPath('./')
require('graphql-import-node/register')


/*
 * SERVER
 */
const _Server = async () => {
  // Const assignment.
  const _Debug = __Debug('Boot')

  // Error handling.
  try {
    // Const assignment.
    const _home = require('path').resolve('./')

    // Load all env variables.
    require('dotenv').config({ 'path': `${_home}/.env` })

    // Const assignment.
    const _globalsToExport = {
      'CONFIG_RC': {
        'httpPort': 4000,
        'filemanager': {
          'endpoint': 'https://blr1.digitaloceanspaces.com',
          'bucketname': 'smsflash',
          'key': 'DO00QZ3UTTP9HKFQ3GX7',
          'secret': 'rHK87eE0ILq7P1mWfdc4IK7UYxcscNuLclVnxEYHgO8',
          'region': 'blr1',
          'acl': 'public-read',
          'responseContentDisposition': 'attachment',
          'name': 'digitalocean'
        },
        'debug': {
          'dsn': 'https://fff2836eb95449d9a8c4a591cfc17008@o4506946981920768.ingest.us.sentry.io/4506946985852928'
        },
        'maxSelectionTake': 1000,
        'secret': 'U8dtV12W/|K]',
        'osUsername': 'smsflash',
        'env': 'DEVELOPMENT',
        'postgresDBReadUrl': process.env.DATABASE_POSTGRES_READ_URL,
        'postgresDBWriteUrl': process.env.DATABASE_POSTGRES_WRITE_URL,
        'restrictedIps': [
          '0.0.0.0',
          'localhost',
          '127.0.0.1',
          '37.27.113.200',
          'black.smsflash.in',
          'smsflash.in',
          'http://smsflash.in',
          'http://black.smsflash.in',
          'https://black.smsflash.in',
          'http://black.smsflash.in',
          'http://0.0.0.0',
          'http://localhost',
          'http://127.0.0.1',
          'http://37.27.113.200'
        ]
      },
      'WORKING_ENV': new Enum({
        'DEVELOPMENT': 'DEVELOPMENT',
        'PRODUCTION': 'PRODUCTION',
        'STAGING': 'STAGING'
      }),
      'ACCOUNT_TYPE': new Enum({
        'PLATFORM': 'PLATFORM'
      })
    }

    // Loop over globals which needs to be export.
    for (const j in _globalsToExport) {
      /*
       * If given j exist in global than skip
       * assigning it.
       */
      if (global && global[j]) continue

      // Assign key value to global.
      global[j] = _globalsToExport[j]
    }

    // Style guide.
    _Debug('Bootstrapping monitoring tool.')

    // Spin up WWW.
    require(require('path').resolve(__dirname, './packages/www/http/'))

    // Report success.
    return void 0
  } catch (error) {
    // Style guide.
    _Debug(error)

    // Report failure.
    return error
  }
}


/*
 * EXPORTS
 */
_Server().catch(e => __Debug('Boot')(`Something went wrong. found error: ${e}`))

