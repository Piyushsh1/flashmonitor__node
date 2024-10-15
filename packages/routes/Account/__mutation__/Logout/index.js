/*
 * EXPORTS
 */
export default async (__, { accountId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Logout'

      // Style guide.
      await Context.Debug({ 'message': `Logging out account with id: ${accountId}` }, _functionName)

      // Kill active session of given account.
      await Context.Session.Kill(accountId)

      // Style guide.
      await Context.Debug({ 'message': `Successfully logged out account with id: ${accountId}` }, _functionName)

      // Report message.
      return {
        'message': `Successfully logged out the account: ${accountId}`,
        'status': 'UPDATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
