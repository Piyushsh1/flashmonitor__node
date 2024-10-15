/*
 * IMPORTS
 */
import ImageExt from 'image-extensions' // Npm: image extension handler.
import _ from 'underscore' // Npm: utility module.
import { Readable } from 'stream' // Core: Node.js stream handling module.
import { Buffer } from 'buffer' // Core: Node.js buffer module.
import { GraphQLError, GraphQLScalarType } from 'graphql' // Npm: graphql Maps.


/*
 * EXPORTS
 */
export default new GraphQLScalarType({
  'name': 'Image',
  'description': 'Scalar Image object allowing only valid image types to pass validation. in any incorrect image type is provided than error is reported. Library used: image-extensions',
  async parseValue(value) {
    // Local variable.
    let _value

    // Variable assignment.
    _value = await value.promise ?? await value

    // Object assignment.
    const _ImageValidator = __value => {
      // Only proceed if given value is not null.
      if (__value) {
        // Local variable.
        let _fileExtension

        // Const assignment.
        const _fileName = __value.name ?? __value.fileName ?? __value.filename

        // Variable assignment.
        _fileExtension = (_fileName.match(/\.[0-9a-z]+$/iu))[0]
        _fileExtension = _fileExtension.replace('.', '')?.toLowerCase()

        /*
         * Update value with fileName instead of filename.
         * With exception to jpg file format as sometime diff mimetype
         * and extension name causes trouble while uploading file locally.
         */
        Object.assign(__value, { 'fileName': _fileName?.toLowerCase().replace(_fileExtension, 'jpg' === _fileExtension && 'image/jpeg' === __value.mimetype ? 'jpeg' : _fileExtension) })

        /*
         * Return promise as is if is valid
         * image else report failure.
         */
        if (ImageExt && ImageExt.includes(_fileExtension)) return Promise.resolve(__value)
      }

      // Report failure.
      throw new GraphQLError(`Expected image but got: ${__value}`)
    }

    /*
     * If given value is object or array
     * than loop over it else return single
     * value.
     */
    if (_.isArray(_value)) {
      // Deep loop over object check for promise _clonedValues.
      for (const jack of _value) {
        /*
         * If given parent _clonedValue is object
         * and has promise object
         * than check if it is valid image or not.
         */
        if (jack && jack.promise) {
          // Check if given item is valid promise.
          const _imageValidation = _ImageValidator(jack)

          /*
           * If validation caught exception than
           * report failure.
           */
          if (_imageValidation instanceof Error) return _imageValidation
        }
        if (jack && jack.createReadStream && _.isEmpty(jack.file)) {
          // Create new entry with file in it.
          jack.file = {
            'createReadStream': jack.createReadStream,
            'isImage': true
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
            'isImage': true
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
        'isImage': true
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
          'isImage': true
        }
      }
    }

    // Return image validation as is.
    return _value
  }
})
