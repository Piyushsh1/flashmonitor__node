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
      const _functionName = 'Routes -> Account -> Login -> WithEmail'

      // Variable assignment.
      let _SessionJwtSign

      // Style guide.
      await Context.Debug({ 'message': `Logging in account with email: ${email}` }, _functionName)

      // Get account by given email.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 
        'where': { email }, 
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'isBlocked': true,
          'displayName': true,
          'thumbnailStoredAt': true,
          'accountType': true,
          'email': true,
          'is2FAEnabled': true,
          'password': true,
          'profileCoverThumbnailStoredAt': true,
          'CustomerLogin': { 
            'where': { 'isDeleted': false },
            'select': {
              'id': true,
              'displayName': true
            }
          }, 
          'VendorLogin': {
            'where': { 'isDeleted': false },
            'select': {
              'id': true,
              'displayName': true
            }
          }
        }
      })

      /*
       * If account with given email doesn't exists
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
      } else if (_AccountFindUnique?.isBlocked) {
        // Style guide.
        await Context.Debug({ 'message': `Account with email: ${email} is blocked.` }, _functionName)

        // Report failure.
        return new Error('ACCOUNT_IS_BLOCKED')
      }

      // Style guide.
      await Context.Debug({ 'message': `Verifying password for account with email: ${email}` }, _functionName)

      // Verify given account with given password.
      const _Argon2Verify = await Argon2.verify(_AccountFindUnique.password, password)

      /*
       * On successful verification return
       * with account details.
       */
      if (_Argon2Verify) {
        // Style guide.
        await Context.Debug({ 'message': `Password verified for account with email: ${email}` }, _functionName)
        await Context.Debug({ 'message': `Logging in account with email: ${email}` }, _functionName)

        // Generate session token for given login.
        _SessionJwtSign = await Context.Session.JwtSign(_AccountFindUnique)

        /*
         * On successful sign of jwt reply to
         * Client.
         */
        if (!_.isEmpty(_SessionJwtSign) && !(_SessionJwtSign instanceof Error)) {
          // Style guide.
          await Context.Debug({ 'message': `Login successful returning token: ${_SessionJwtSign}` })

          // Return success.
          return {
            'message': `${email} logged in successful.`,
            'token': _SessionJwtSign,
            'status': 'READ_SUCCESSFUL',
            ..._.omit(_AccountFindUnique, 'password')
          }
        }

        // Style guide.
        await Context.Debug({ 'message': `Failed to login account with email: ${email}`, 'error': _SessionJwtSign }, _functionName)

        // Report failure.
        return _SessionJwtSign instanceof Error ? _SessionJwtSign : new Error('REQUIRE_JWT')
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to verify password for account with email: ${email}` }, _functionName)

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
