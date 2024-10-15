/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { accountId, email, isBlocked }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> IsBlocked -> WithEmailOrAccountId'

      // Local variable.
      let _AccountFindMany

      // Style guide.
      await Context.Debug({ 'message': `Updating account block for account with id: ${accountId ?? email}` }, _functionName)

      /*
       * Try to get account with above given accountId
       * or email address.
       */
      _AccountFindMany = await Context.DataBase.account.findMany({ 'where': { 'OR': [{ email }, { 'id': { 'equals': accountId } }] } })
      _AccountFindMany = _.isArray(_AccountFindMany) ? _.first(_AccountFindMany) : _AccountFindMany

      /*
       * If getting device caught exception
       * than report failure.
       */
      if (_AccountFindMany && _AccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? email}`, 'error': _AccountFindMany }, _functionName)

        // Report failure.
        return _AccountFindMany
      }

      /*
       * Only proceed if given account exist
       * else report failure.
       */
      if (_AccountFindMany && _AccountFindMany.id) {
        // Style guide.
        await Context.Debug({ 'message': `Updating account block for account with id: ${accountId ?? email}` }, _functionName)

        /*
         * Ban given user account if isBlocked is set to true
         * and remove any session previously active.
         */
        if (isBlocked) {
          // Style guide.
          await Context.Debug({ 'message': `Removing session for account with id: ${_AccountFindMany.id}` }, _functionName)

          // Const assignment.
          const _Cache_ = await Context.Cache.delete(`SESSION::${_AccountFindMany.id}`)

          /*
           * If removing session caught exception than report
           * failure else continue.
           */
          if (_Cache_ && _Cache_ instanceof Error) {
            // Style guide.
            await Context.Debug({ 'message': `Failed to remove session for account with id: ${_AccountFindMany.id}`, 'error': _Cache_ }, _functionName)

            // Report failure.
            return _Cache_
          }
        }

        // Style guide.
        await Context.Debug({ 'message': `Updating account block for account with id: ${accountId ?? email}` }, _functionName)

        // Mark given account as isBlocked in DataBase.
        const _AccountUpdate = await Context.DataBase.account.update({ 'where': { 'id': _AccountFindMany.id }, 'data': { isBlocked } })

        /*
         * If updating account isBlocked caught exception than report
         * failure else continue.
         */
        if (_AccountUpdate && _AccountUpdate instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to update account block for account with id: ${accountId ?? email}`, 'error': _AccountUpdate }, _functionName)

          // Report failure.
          return _AccountUpdate
        }

        // Style guide.
        await Context.Debug({ 'message': `Successfully updated account block for account with id: ${accountId ?? email}` }, _functionName)

        // Report done.
        return {
          'message': 'Account block updated successfully',
          'status': 'UPDATE_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? email}` }, _functionName)

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
