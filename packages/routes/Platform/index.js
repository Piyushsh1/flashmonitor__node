/*
 * IMPORTS
 */
import { mergeTypeDefs } from '@graphql-tools/merge' // Npm: graphql typeDefs merger.


/*
 * HANDLERS
 */
import * as IndexMutation from './__mutation__'
import * as IndexResolver from './__resolver__'
import * as IndexSubscription from './__subscription__'


/*
 * GRAPH
 */
import IndexGraph from './index.graphql'


/*
 * GLOBALS
 */
const typeDefs = mergeTypeDefs([IndexGraph])
const resolvers = IndexResolver
const Mutation = IndexMutation
const Subscription = IndexSubscription


/*
 * EXPORTS
 */
export default { resolvers, Mutation, typeDefs, Subscription }
