/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import Argon2 from 'argon2' // Npm: argon2 encryption library.


/*
 * EXPORTS
 */
export default async (__, { email, password }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> ForgotPassword -> WithEmail'

      // Variable assignment.
      let _SessionJwtSign

      // Style guide.
      await Context.Debug({ 'message': `Updating password for account with email: ${email}` }, _functionName)

      // Get given email and if given email exist
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { email } })

      /*
       * If account with given email exists
       * then return error rasing this issue.
       */
      if (_AccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with email: ${email}`, 'error': _AccountFindUnique }, _functionName)

        // Report failure.
        return _AccountFindUnique
      } else if (_.isEmpty(_AccountFindUnique)) {
        // Style guide.
        await Context.Debug({ 'message': `Account with email: ${email} not found.` }, _functionName)

        // Return login
        return new Error('ACCOUNT_WITH_EMAIL_NOT_FOUND')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating password for account with email: ${email}` }, _functionName)

      // Update account password.
      const _AccountUpdate = await Context.DataBase.account.update({ 'where': { email }, 'data': { 'password': await Argon2.hash(password) } })

      /*
       * On successful updating return
       * with account detail.
       */
      if (_AccountUpdate) {
        // Style guide.
        await Context.Debug({ 'message': `Password updated for account with email: ${email}` }, _functionName)
        await Context.Debug({ 'message': `Logging in account with email: ${email}` }, _functionName)

        // Generate session token for given login.
        _SessionJwtSign = await Context.Session.JwtSign(_AccountUpdate)

        /*
         * On successful _SessionJwtSign return
         * token to the Client.
         */
        if (!_.isEmpty(_SessionJwtSign) && !(_SessionJwtSign instanceof Error)) {
          // Style guide.
          await Context.Debug({ 'message': `Successfully login returning token: ${_SessionJwtSign}` }, _functionName)

          // Report success.
          return {
            'message': `${email} logged in successful.`,
            'token': _SessionJwtSign,
            'status': 'UPDATE_SUCCESSFUL',
            ..._AccountFindUnique
          }
        }

        // Style guide.
        await Context.Debug({ 'message': `Failed to login account with email: ${email}`, 'error': _SessionJwtSign }, _functionName)

        // Report failure.
        return _SessionJwtSign instanceof Error ? _SessionJwtSign : new Error('REQUIRE_JWT')
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to update password for account with email: ${email}` }, _functionName)

      // Report failure.
      return new Error('INVALID_CREDENTIALS')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
