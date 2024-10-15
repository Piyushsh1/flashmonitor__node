/*
 * IMPORTS
 */
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
      // Const assignment.
      const _functionName = 'Routes -> Account -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting account with id: ${accountId}` }, _functionName)

      // Get account details of given account id.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': accountId } })

      // If retrieving account details encounters an exception, report failure.
      if (_.isEmpty(_AccountFindUnique) || _AccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with id: ${accountId}`, 'error': _AccountFindUnique }, _functionName)

        // Report failure.
        return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('EXPECTED_ACCOUNT_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting account with id: ${accountId}` }, _functionName)

      // Delete account details of given account id.
      await Context.DataBase.account.delete({ 'where': { 'id': accountId } })

      // Invalidate live store as well.
      await Context.LiveStore.invalidate('Query.AccountRead')

      // Return success.
      return {
        'id': _AccountFindUnique.id,
        'message': 'Successfully removed the account.',
        'status': 'DELETE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
