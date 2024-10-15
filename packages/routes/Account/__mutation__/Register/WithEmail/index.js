/*
 * IMPORTS
 */
import Argon2 from 'argon2' // Npm: argon2 encryption library.
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { email, password, accountType, displayName, referralId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Register -> WithEmail'

      // Style guide.
      await Context.Debug({ 'message': `Registering account with email: ${email}` }, _functionName)

      // Get account with given email.
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
      } else if (!_.isEmpty(_AccountFindUnique)) {
        // Style guide.
        await Context.Debug({ 'message': `Account with email: ${email} already exists.` }, _functionName)

        // Return login
        return new Error('ACCOUNT_WITH_EMAIL_FOUND')
      }

      // Local variable.
      let _AccountFindMany

      /*
       * If displayName is provided than check then
       * no other account have given displayName if
       * so than report failure.
       */
      _AccountFindMany = await Context.DataBase.account.findMany({ 'where': { displayName } })
      _AccountFindMany = _.isArray(_AccountFindMany) ? _.first(_AccountFindMany) : _AccountFindMany

      // Report failure if _AccountFindMany caught exception.
      if (_AccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with displayName: ${displayName}`, 'error': _AccountFindMany }, _functionName)

        // Report failure.
        return _AccountFindMany
      }

      /*
       * If _AccountFindMany is not empty
       * than report failure else update data.
       */
      if (!_.isEmpty(_AccountFindMany) && _AccountFindMany.displayName === displayName) {
        // Style guide.
        await Context.Debug({ 'message': `Account with displayName: ${displayName} already exist` }, _functionName)

        // Report failure.
        return new Error('ACCOUNT_DISPLAY_NAME_ALREADY_EXISTS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Creating account with email: ${email}` }, _functionName)

      // Get account type from global account type.
      accountType = accountType ? ACCOUNT_TYPE.get(accountType)?.value : void 0

      // Create account entry for given user details.
      const _AccountCreate = await Context.DataBase.account.create({
        'data': {
          'displayName': displayName,
          'accountType': accountType,
          'email': email,
          'password': await Argon2.hash(password),
          'referralId': referralId
        }
      })

      // If creating account caught exception than report failure.
      if (_.isEmpty(_AccountCreate) || _AccountCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to create account with email: ${email}`, 'error': _AccountCreate }, _functionName)

        // Report failure.
        return _AccountCreate instanceof Error ? _AccountCreate : new Error('FAILED_TO_CREATE_ACCOUNT')
      }

      // Style guide.
      await Context.Debug({ 'message': `Account created with email: ${email}` }, _functionName)
      await Context.Debug({ 'message': `Logging in account with email: ${email}` }, _functionName)

      // Generate session token for given registration.
      const _SessionJwtSign = await Context.Session.JwtSign(_AccountCreate)

      // On successful _SessionJwtSign return token to the user
      if (!_.isEmpty(_SessionJwtSign) && !(_SessionJwtSign instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': `Registration successful returning token: ${_SessionJwtSign}` })

        // Return success.
        return {
          'message': `${email} registration successful.`,
          'token': _SessionJwtSign,
          'status': 'CREATE_SUCCESSFUL',
          ..._AccountCreate
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to login account with email: ${email}`, 'error': _SessionJwtSign }, _functionName)

      // Report failure.
      return _SessionJwtSign instanceof Error ? _SessionJwtSign : new Error('REQUIRE_JWT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
