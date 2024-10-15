/*
 * IMPORTS
 */
import Argon2 from 'argon2' // Npm: argon2 module.
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { accountId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Local variable.
      let _PlatformFindMany

      // Const assignment.
      const _functionName = 'Routes -> Platform -> Configuration'

      //  Style guide.
      await Context.Debug({ 'message': 'Updating platform configuration.' }, _functionName)

      // Search for the given platform.
      _PlatformFindMany = await Context.DataBase.platform.findMany({
        'where': {
          'Account__fk__': accountId
        },
        'orderBy': {
          'updatedAt': 'desc'
        }
      })

      console.log('x-x--x-x', _PlatformFindMany)
      _PlatformFindMany = _.isArray(_PlatformFindMany) ? _.first(_PlatformFindMany) : _PlatformFindMany

      // If given platform already exists then report failure.
      if (_PlatformFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find platform entry.', 'error': _PlatformFindMany }, _functionName)

        // Report failure.
        return _PlatformFindMany
      }
      if (_.isEmpty(_PlatformFindMany)) return new Error('PLATFORM_NOT_FOUND')

      // Style guide.
      await Context.Debug({ 'message': 'Successfully found platform.' }, _functionName)

      // Style guide.
      return {
        ..._PlatformFindMany,
        'status': 'READ_SUCCESSFUL',
        'message': 'Successfully retrived the configuration.'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
