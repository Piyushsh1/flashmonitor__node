/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { search }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Search'

      // Local variable.
      let _AccountFindMany

      // Style guide.
      await Context.Debug({ 'message': `Searching account with search: ${search}` }, _functionName)

      // Get all entries matching to given search.
      _AccountFindMany = await Context.DataBase.account.findMany({
        'where': {
          'isDeleted': false,
          'accountType': {
            'not': 'ADMIN'
          },
          'OR': [
            {
              'fullName': {
                'startsWith': search,
                'mode': 'insensitive'
              },
              'displayName': {
                'startsWith': search,
                'mode': 'insensitive'
              }
            }
          ]
        }
      })

      /*
       * If getting search caught exception than
       * report failure.
       */
      if (_AccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to search account with search: ${search}`, 'error': _AccountFindMany }, _functionName)

        // Report failure.
        return _AccountFindMany
      }

      // Style guide.
      await Context.Debug({ 'message': _.isEmpty(_AccountFindMany) ? 'Search successful found empty seems that there is no entry in database.' : `Successfully searched account with search: ${search}` }, _functionName)

      // Update search results with status.
      !_.isEmpty(_AccountFindMany) && _AccountFindMany.map(v => Object.assign(v, { 'status': 'READ_SUCCESSFUL', 'message': 'Successfully fetched accounts matching to given search ' }))
      _.isEmpty(_AccountFindMany) && (_AccountFindMany = [{ 'status': 'NO_MATCH_FOUND', 'message': 'it seems that no account matches to given search.' }])

      // Style guide.
      await Context.Debug({ 'message': `Returning search result for search: ${search}` }, _functionName)

      // Return search result.
      return _AccountFindMany
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
