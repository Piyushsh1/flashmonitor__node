/*
 * PACKAGES
 */
import Tag from 'tag'


/*
 * EXPORTS
 */
export default {
  'subscribe': (__, ___, Context) => Context.Session && Context.Session.isLoggedIn ? Context.Pubsub.subscribe(Tag.Account.Setting(Context.Session.user.id)) : void 0,
  'resolve': __data => __data
}
