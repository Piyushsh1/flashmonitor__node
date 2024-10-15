/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import DeepLoop from 'deep-iterator' // Npm: deep loop Maps for iterating over every object key


/*
 * PACKAGES
 */
import FileManager from 'filemanager'
import Tag from 'tag'


/*
 * EXPORTS
 */
export default async (__, { accountId, dimensionsToChopIn, ...__files }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is passed
     * else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Upload'

      // Style guide.
      await Context.Debug({ 'message': `Checking if upload contains any files.` }, _functionName)

      /*
       * If any update is empty than report
       * failure else continue.
       */
      if (!_.isEmpty(__files)) {
        // Style guide.
        await Context.Debug({ 'message': `Uploading files to account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

        // Local variable.
        let _FileManager_

        // Const assignment.
        const _expireIn = '7 days'

        /*
         * Deep loop over __files and await each
         * file if available as promise.
         */
        for await (const { parent, key, value } of DeepLoop(__files)) {
          // If parent and key is not empty.
          if (!_.isEmpty(await parent) && !_.isEmpty(await value)) parent[key] = await value
        }

        // Loop over files and update each one.
        for await (const file of Object.entries(await __files)) {
          // Only process uploads if upload files are provided.
          if (file) {
            // Style guide.
            await Context.Debug({ 'message': `Uploading file to account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

            // Upload given file to file manager.
            _FileManager_ = await new FileManager({ 'file': file[1].file, 'path': `account/${file[0]}/${accountId ?? Context.Session.user.id}/${Date.now()}/` }, { dimensionsToChopIn })

            // If uploading contains error than report failure.
            if (!_.isEmpty(_FileManager_) && !(_FileManager_ instanceof Error)) {
              // Style guide.
              await Context.Debug({ 'message': `Successfully uploaded file to account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)
              await Context.Debug({ 'message': `Saving file to cache for account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

              // Save file to cache handler for given client.
              const _Cache_ = await Context.Cache.set({ 'id': `ACCOUNT::${file[0].toUpperCase()}::${accountId ?? Context.Session.user.id}`, 'whatToCache': _FileManager_ }, { 'expireIn': _expireIn })

              /*
               * If uploading file to cache contains error than report
               * failure else continue.
               */
              if (!_.isEmpty(_Cache_) && !(_Cache_ instanceof Error)) {
                // Style guide.
                await Context.Debug({ 'message': `Successfully saved file to cache for account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)
                await Context.Debug({ 'message': `Updating file to database for account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

                // Update files to the database.
                const _AccountUpdate = await Context.DataBase.account.update({
                  'where': { 'id': accountId ?? Context.Session.user.id },
                  'data': {
                    [file[0]]: _FileManager_
                  }
                })

                // If updating caught exception than report failure.
                if (_AccountUpdate instanceof Error) {
                  // Style guide.
                  await Context.Debug({ 'message': `Failed to update file to database for account with id: ${accountId ?? Context.Session.user.id}`, 'error': _AccountUpdate }, _functionName)

                  // Report failure.
                  return _AccountUpdate
                }

                // Style guide.
                await Context.Debug({ 'message': `Successfully updated file to database for account with id: ${accountId ?? Context.Session.user.id}` }, _functionName)

                // Assign return object.
                const _return = {
                  [file[0]]: _FileManager_,
                  'message': 'Upload Successful..',
                  'status': 'UPDATE_SUCCESSFUL'
                }

                // Publish all updates to pubsub.
                Context.Pubsub.publish(Tag.Account.Detail(accountId ?? Context.Session.user.id), _return)

                // Return successful.
                return _return
              }

              // Style guide.
              await Context.Debug({ 'message': `Failed to save file to cache for account with id: ${accountId ?? Context.Session.user.id}`, 'error': _Cache_ }, _functionName)

              // Report failure.
              return _Cache_ instanceof Error ? _Cache_ : new Error('CACHED_PATH_REQUIRED')
            }

            // Style guide.
            await Context.Debug({ 'message': `Failed to upload file to account with id: ${accountId ?? Context.Session.user.id}`, 'error': _FileManager_ }, _functionName)

            // Report failure.
            return _FileManager_ instanceof Error ? _FileManager_ : new Error('UPLOAD_FAILED')
          }
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Upload missing files reporting failure.` }, _functionName)

      // Report failure.
      return new Error('UPLOAD_MISSING')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
