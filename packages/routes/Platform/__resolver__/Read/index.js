/*
 * EXPORTS
 */
export default async (__, ___, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Platform -> Read'

      // Style guide.
      await Context.Debug({ 'message': 'Searching for any previous entry for platform read.' }, _functionName)

      // Get count of total platform in database.
      const _PlatformFindMany = await Context.DataBase.platform.findMany({ 'where': {} })

      // If query caught exception then report failure.
      if (_PlatformFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of platform.', 'error': _PlatformFindMany }, _functionName)

        // Report failure.
        return _PlatformFindMany
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully found platform.` }, _functionName)

      // Return the list.
      return _PlatformFindMany.map(e => ({ ...e, 'status': 'READ_SUCCESSFUL', 'message': 'Successfully retrieved platform.' }))
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
