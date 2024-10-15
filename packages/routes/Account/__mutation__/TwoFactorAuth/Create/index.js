/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import { authenticator } from 'otplib' // Npm: One-time password library.


/*
 * EXPORTS
 */
export default async (__, { email, token }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> TwoFactorAuth -> Verify'

      // Style guide.
      await Context.Debug({ 'message': `Verifying 2FA for email: ${email}` }, _functionName)

      // Get account by given email.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { email } })

      // If account with given email doesn't exists throw error
      if (_.isEmpty(_AccountFindUnique)) {
        // Style guide.
        await Context.Debug({ 'message': `Account with email: ${email} not found` }, _functionName)

        // Return Error
        return new Error('ACCOUNT_WITH_EMAIL_NOT_FOUND')
      } else if (_AccountFindUnique.isBlocked) {
        // Style guide.
        await Context.Debug({ 'message': `Account with email: ${email} is blocked` }, _functionName)

        // Return Error
        return new Error('ACCOUNT_IS_BLOCKED')
      }

      // Verify the token
      const _isTokenValid = authenticator.check(token, _AccountFindUnique.twoFactorAuthentication)

      // If token is invalid throw error
      if (!_isTokenValid) {
        // Style guide.
        await Context.Debug({ 'message': 'Invalid 2FA token.' }, _functionName)

        // Return Error.
        return new Error('INVALID_2FA_TOKEN')
      }

      // Style guide.
      await Context.Debug({ 'message': '2FA verification successful.' }, _functionName)

      // Update account with 2FA enabled.
      await Context.DataBase.account.update({
        'where': {
          'id': _AccountFindUnique.id
        },
        'data': {
          'is2FAEnabled': true
        }
      })

      // Return success message.
      return {
        'message': '2FA verification successful.',
        'status': '2FA_VERIFIED'
      }
    }

    // Return error.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Style guide.
    await Context.Debug({ 'message': `Error verifying 2FA for email: ${email}`, 'error': error }, 'Routes -> Account -> Login -> Verify2FA')

    // Return error
    return error
  }
}
