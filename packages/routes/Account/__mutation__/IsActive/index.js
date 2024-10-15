/*
 * EXPORTS
 */
export default async (__, { accountId, isActive }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> IsActive'

      // Style guide.
      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Fetch account with given accountId or current user id.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': accountId ?? Context.Session.user.id } })

      /*
       * If getting account caught exception
       * than report failure.
       */
      if (_AccountFindUnique && _AccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountFindUnique }, _functionName)

        // Report failure.
        return _AccountFindUnique
      }

      /*
       * Only proceed if given account exist
       * else report failure.
       */
      if (_AccountFindUnique && _AccountFindUnique.id) {
        // Style guide.
        await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

        // Update account detail in database.
        const _AccountUpdate = await Context.DataBase.account.update({ 'where': { 'id': _AccountFindUnique.id }, 'data': { isActive } })

        /*
         * If updating account caught exception than report
         * failure.
         */
        if (_AccountUpdate && _AccountUpdate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountUpdate }, _functionName)

          // Report failure.
          return _AccountUpdate
        }

        // Style guide.
        await Context.Debug({ 'message': `Successfully updated account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

        // Report done.
        return {
          'message': 'Account flag updated successfully',
          'status': 'UPDATE_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Report failure.
      return new Error('FAILED_TO_FIND_ACCOUNT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
