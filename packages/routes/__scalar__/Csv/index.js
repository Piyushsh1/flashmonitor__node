/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.
import { Readable } from 'stream' // Core: Node.js stream handling module.
import { Buffer } from 'buffer' // Core: Node.js buffer module.
import { GraphQLScalarType } from 'graphql' // Npm: graphql Maps.


/*
 * EXPORTS
 */
export default new GraphQLScalarType({
  'name': 'Csv',
  'description': 'Scalar Csv object allowing only valid file which are meant to be csv files or excel files.',
  async parseValue(value) {
    // Local variable.
    let _value

    // Variable assignment.
    _value = await value.promise ?? await value

    /*
     * If given value is object or array
     * than loop over it else return single
     * value.
     */
    if (_.isArray(_value)) {
      // Deep loop over object check for promise _clonedValues.
      for (const jack of _value) {
        // Only create read stream of file.
        if (jack && jack.createReadStream && _.isEmpty(jack.file)) {
          // Create new entry with file in it.
          jack.file = {
            'createReadStream': jack.createReadStream,
            'isCsv': true
          }

          // Remove old readStream.
          delete jack.createReadStream
        } else if (jack && !_.isEmpty(jack.blobParts)) {
          // Create a readable stream from the buffer
          const _Stream = new Readable()

          // Push buffer to stream.
          _Stream.push(Buffer.concat(jack.blobParts.map(p => Buffer.from(p))))
          _Stream.push(void 0)

          // Convert file to readStream.
          jack.file = {
            'mimetype': jack.type ?? jack.mimetype,
            'fileName': jack.name ?? jack.fileName ?? jack.filename,
            'createReadStream': () => _Stream,
            'isCsv': true
          }
        }
      }

      // Return _value on completion.
      return _value
    }

    /*
     * Only create read stream of file
     * if createReadStream is available on
     * object.
     */
    if (_value && _value.createReadStream && _.isEmpty(_value.file)) {
      // Update read stream as file.
      _value.file = {
        'createReadStream': _value.createReadStream,
        'isCsv': true
      }

      // Remove old read stream.
      delete _value.createReadStream
    } else if (_value && !_.isEmpty(_value.blobParts)) {
      // Create a readable stream from the buffer
      const _Stream = new Readable()

      // Push buffer to stream.
      _Stream.push(Buffer.concat(_value.blobParts.map(p => Buffer.from(p))))
      _Stream.push(null)

      // Convert file to readStream.
      _value = {
        'file': {
          'mimetype': _value.type ?? _value.mimetype,
          'fileName': _value.name ?? _value.fileName ?? _value.filename,
          'createReadStream': () => _Stream,
          'isCsv': true
        }
      }
    }

    // Return csv validation as is.
    return _value
  }
})
