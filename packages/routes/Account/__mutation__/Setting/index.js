/*
 * IMPORTS
 */
import Argon2 from 'argon2' // Npm: password hashing.
import _ from 'underscore' // Npm: utility module.


/*
 * PACKAGES
 */
import Tag from 'tag'


/*
 * EXPORTS
 */
export default async (__, {
  accountId,
  displayName,
  fullName,
  password,
  bio,
  email,
  website,
  isBlocked,
  is2FAEnabled,
  accountType
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Setting'

      // Local variable.
      let _dataToUpdate

      // Get userAccount details with given id.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({ 'where': { 'id': accountId ?? Context.Session.user.id } })

      // If getting _account from cache caught exception than report failure.
      if (_.isEmpty(_AccountFindUnique) || _AccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountFindUnique }, _functionName)

        // Report failure.
        return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('FAILED_TO_FIND_ACCOUNT')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Update setting based on information provided.
      if (!_.isEmpty(bio)) _dataToUpdate = { ..._dataToUpdate, 'bio': bio }
      if (!_.isEmpty(displayName)) _dataToUpdate = { ..._dataToUpdate, 'displayName': displayName }
      if (!_.isEmpty(email)) _dataToUpdate = { ..._dataToUpdate, 'email': email }
      if (!_.isEmpty(fullName)) _dataToUpdate = { ..._dataToUpdate, 'fullName': fullName }
      if (!_.isEmpty(website?.href)) _dataToUpdate = { ..._dataToUpdate, 'website': website?.href }
      if (!_.isEmpty(isBlocked)) _dataToUpdate = { ..._dataToUpdate, 'isBlocked': isBlocked }
      if (!_.isEmpty(accountType)) _dataToUpdate = { ..._dataToUpdate, 'accountType': accountType }
      if (!_.isEmpty(password)) _dataToUpdate = { ..._dataToUpdate, 'password': await Argon2.hash(password) }
      _dataToUpdate = { ..._dataToUpdate, 'is2FAEnabled': is2FAEnabled }

      // If dataToUpdate is empty then report failure.
      if (_.isEmpty(_dataToUpdate)) {
        // Const assignment.
        const _error = new Error('NO_DATA_TO_UPDATE')

        // Style guide.
        await Context.Debug({ 'message': `Failed to update account with id: ${accountId ?? Context.Session.user.id}`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': `Updated account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      /*
       * Only validate if displayName is passed
       * else continue updating.
       */
      if (!_.isEmpty(displayName)) {
        // Style guide.
        await Context.Debug({ 'message': `Validating displayName: ${displayName}` }, _functionName)

        // Local variable.
        let _AccountFindMany

        /*
         * If displayName is provided than check then
         * no other account have given displayName if
         * so than report failure.
         */
        _AccountFindMany = await Context.DataBase.account.findMany({ 'where': { displayName, 'id': { 'not': accountId ?? Context.Session.user.id } } })
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
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Update account details.
      const _AccountUpdate = await Context.DataBase.account.update({ 'data': _dataToUpdate, 'where': { 'id': accountId ?? Context.Session.user.id } })

      /*
       * Only proceed if updateAccount doesn't contain
       * any error else report failure.
       */
      if (_AccountUpdate && _AccountUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountUpdate }, _functionName)

        // Report failure.
        return _AccountUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Updated account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

      // Return updates.
      const _return = {
        ..._AccountUpdate,
        'message': 'Account updated successfully',
        'status': 'UPDATE_SUCCESSFUL'
      }

      // Publish all updates to pubsub.
      await Context.Pubsub.publish(Tag.Account.Setting(Context.Session.user.id), _return)

      // Invalidate live store as well.
      await Context.LiveStore.invalidate('Query.AccountRead')

      // Return update with status code.
      return _return
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
