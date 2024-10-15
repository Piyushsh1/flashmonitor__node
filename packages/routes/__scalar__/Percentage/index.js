/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import { GraphQLScalarType } from 'graphql' // Npm: graphql Maps.


/*
 * EXPORTS
 */
export default new GraphQLScalarType({
  'name': 'Percentage',
  'description': 'Scalar Percentage object allowing valid percentage values.',
  parseValue(__value) {
    // Remove leading and trailing whitespace
    const _trimmedValue = _.trim(__value)

    // Check if the trimmed value ends with '%'
    if (_.endsWith(_trimmedValue, '%')) {
      // Remove the '%' character
      const _numericValue = parseFloat(_trimmedValue)

      // Check if the remaining value is a valid number
      if (!isNaN(_numericValue)) {
        // Divide the numeric value by 100 to convert it to a fraction
        return _numericValue / 100
      }
    }

    // Return the original value if it's not a valid percentage
    return __value
  }
})
