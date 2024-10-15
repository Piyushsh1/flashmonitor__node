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
import * as IndexDirective from './__directive__'


/*
 * GRAPH
 */
import IndexGraph from './index.graphql'
import IndexDirectiveGraph from './index.directive.graphql'
import IndexEnumGraph from './index.enum.graphql'


/*
 * GLOBALS
 */
const typeDefs = mergeTypeDefs([IndexGraph, IndexEnumGraph, IndexDirectiveGraph])
const resolvers = IndexResolver
const Mutation = IndexMutation
const Subscription = IndexSubscription
const Directive = IndexDirective


/*
 * EXPORTS
 */
export default { resolvers, Mutation, typeDefs, Subscription, Directive }


