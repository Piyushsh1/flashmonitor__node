/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { displayName, copyright, logo }, Context) => {
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
      const _functionName = 'Routes -> Platform -> Upsert'

      //  Style guide.
      await Context.Debug({ 'message': 'Checking if any previous entry exists in system or not.' }, _functionName)

      // Search for the given platform.
      _PlatformFindMany = await Context.DataBase.platform.findMany({ 'where': {} })
      _PlatformFindMany = _.isArray(_PlatformFindMany) ? _.first(_PlatformFindMany) : _PlatformFindMany

      // If given platform already exists then report failure.
      if (_PlatformFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find platform entry.', 'error': _PlatformFindMany }, _functionName)

        // Report failure.
        return _PlatformFindMany
      }
      if (_.isEmpty(_PlatformFindMany)) {
        // Style guide.
        await Context.Debug({ 'message': 'Creating fresh entry..' }, _functionName)

        // Create given platform.
        const _PlatformCreate = await Context.DataBase.platform.create({
          'data': {
            'displayName': displayName,
            'copyright': copyright,
            'logo': logo
          }
        })

        // If creating platform fails then report failure.
        if (_PlatformCreate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to create platform.', 'error': _PlatformCreate }, _functionName)

          // Report failure.
          return _PlatformCreate
        }

        // Style guide.
        await Context.Debug({ 'message': `Successfully created the platform.` }, _functionName)

        // Style guide.
        return {
          ..._PlatformCreate,
          'status': 'UPSERT_SUCCESSFUL',
          'message': 'Successfully created platform entry.'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': 'Updating existing entry..' }, _functionName)

      // Update given platform.
      const _PlatformUpdate = await Context.DataBase.platform.update({
        'where': { 'id': _PlatformFindMany.id },
        'data': {
          'displayName': displayName,
          'copyright': copyright,
          'logo': logo
        }
      })

      // If updating platform fails then report failure.
      if (_PlatformUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to update platform.', 'error': _PlatformUpdate }, _functionName)

        // Report failure.
        return _PlatformUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated the platform.` }, _functionName)

      // Style guide.
      return {
        ..._PlatformUpdate,
        'status': 'UPSERT_SUCCESSFUL',
        'message': 'Successfully updated platform entry.'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
