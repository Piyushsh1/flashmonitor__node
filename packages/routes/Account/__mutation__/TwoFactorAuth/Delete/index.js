/*
 * EXPORTS
 */
export default async (__, { email }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> TwoFactorAuth -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Remove two factor auth from email: ${email}` }, _functionName)

      // Update account with two factor authentication.
      const _AccountUpdate = await Context.DataBase.account.update({
        'where': { email },
        'data': {
          'twoFactorAuthentication': null,
          'is2FAEnabled': false
        }
      })

      // If account update fails then return error.
      if (_AccountUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Error updating account with email: ${email}` }, _functionName)

        // Report failure.
        return _AccountUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully removed the 2FA.' }, _functionName)

      // Return success.
      return {
        'message': 'Successfully removed the 2FA.',
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
