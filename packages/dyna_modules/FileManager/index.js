/*
 * IMPORTS
 */
import Path from 'path' // Core: node.js path module.
import Fs from 'fs-extra' // Npm: file system.
import DeepLoop from 'deep-iterator' // Npm: deep-iterator Maps.
import Stream from 'stream' // NPM: Stream library for handling streams.
import Sharp from 'sharp' // Npm: Module for handling imagemagick through command line.
import _ from 'underscore' // Npm: utility module.
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3' // Npm: aws sdk.


/*
 * EXPORTS
 */
export default async function FileManager({ file, path, storage }, $options = {}) {
  // Constructor call check.
  if (this instanceof FileManager) {
    // Only proceed if file is available
    if (file) {
      // Local variable.
      let _UploadFile, _path

      // Options update.
      this.configuration.whereToUpload = $options.whereToUpload ?? this.configuration.whereToUpload
      this.configuration.dimensionsToChopIn = $options.dimensionsToChopIn ?? $options.dimensionsToChopIn

      // Create storage path for given file or object.
      _path = (Path.join('/', path ?? '/')).replace('/', '')

      // Initiate cloud client for uploading the files.
      const _S3Client = new S3Client({
        'region': this.configuration.s3.region,
        'credentials': {
          'accessKeyId': this.configuration.s3.accessKey,
          'secretAccessKey': this.configuration.s3.secretKey
        },
        'endpoint': this.configuration.s3.endPoint
      })

      // Report failure.
      if (_.isEmpty(_S3Client) || _S3Client instanceof Error) return _S3Client instanceof Error ? _S3Client : new Error('FAULTY_CLIENT')

      // Update client to the context.
      this.Client = _S3Client

      // Only loop over file if is object.
      if (_.isArray(file)) {
        // Const assignment.
        const _return = []

        /*
         * Loop over all post values
         * and look if any value is
         * file.
         */
        /* eslint prefer-const: "off" */
        for await (let { value } of DeepLoop(file)) {
          /*
           * If parent, key and value is readable
           * stream and fields are not empty than
           * only proceed.
           */
          if (value && (value instanceof Stream.Readable || value.createReadStream)) {
            // Upload file.
            _UploadFile = await this.Upload({ 'path': _path, 'stream': value })

            /*
             * If fileUpload caught exception
             * than report failure.
             */
            if (_UploadFile && _UploadFile instanceof Error) return _UploadFile

            /*
             * Update return to output
             * variable.
             */
            if (value && _UploadFile) _return.push(_UploadFile)
          }
        }

        // Return all uploads.
        return _return
      } else if (file && (file instanceof Stream.Readable || file.createReadStream)) {
        // Upload file.
        _UploadFile = await this.Upload({ 'path': _path, 'stream': file })

        /*
         * If fileUpload caught exception
         * than report failure.
         */
        if (_UploadFile && !(_UploadFile instanceof Error)) {
          /*
           * Update file with upload
           * return
           */
          return _UploadFile
        }

        // Report failure.
        return _UploadFile instanceof Error ? _UploadFile : new Error('EXPECTED_UPLOAD_PATH')
      }

      // Report failure.
      return new Error('REQUIRED_FILES')
    } else if (!_.isEmpty(path) && $options.remove) {
      // Remove upload file.
      const _RemoveUploadFile = await this.RemoveUpload({ storage, path })

      /*
       * If RemoveUpload caught exception
       * than report failure.
       */
      if (_RemoveUploadFile && !(_RemoveUploadFile instanceof Error)) {
        /*
         * Remove file with upload
         * return
         */
        return _RemoveUploadFile
      }

      // Report failure.
      return _RemoveUploadFile instanceof Error ? _RemoveUploadFile : new Error('FAILED_TO_REMOVE_FILE')
    }

    // Report failure.
    return new Error('REQUIRED_FILES')
  }

  // Report failure.
  return new Error('NOT__CONSTRUCTOR')
}


/*
 * PROTOTYPE
 */
FileManager.prototype = {
  // Properties.
  'configuration': {
    'whereToUpload': 's3',
    'dimensionsToChopIn': void 0,
    's3': {
      'name': CONFIG_RC.filemanager.name,
      'endPoint': CONFIG_RC.filemanager.endpoint,
      'bucketName': CONFIG_RC.filemanager.bucketname,
      'accessKey': CONFIG_RC.filemanager.key,
      'secretKey': CONFIG_RC.filemanager.secret,
      'dir': '/',
      'responseContentDisposition': CONFIG_RC.filemanager.responseContentDisposition,
      'region': CONFIG_RC.filemanager.region,
      'acl': CONFIG_RC.filemanager.acl
    }
  },

  /*
   * Cloud bucket url generator for given
   * path to file in given bucket.
   */
  'URI': __path => new URL(__path, FileManager.prototype.configuration.s3.endPoint.replace('https://', `https://${FileManager.prototype.configuration.s3.bucketName}.`)).href,

  /*
   * Upload handler for uploading
   * files on server or cloud.
   */
  'Upload': async function({ path, stream }) {
    // Error handling.
    try {
      /*
       * Check type of storage available for storing
       * file if any cloud storage is set than upload
       * all file to cloud else default to local store.
       */
      if ('s3' === this.configuration.whereToUpload) {
        // Local variable.
        let _StreamUpload

        // Instance assignment.
        const _Client_ = this.Client

        /*
         * If dimensions are passed in and given
         * file is image then transform it.
         */
        if (stream.isImage && !_.isEmpty(this.configuration.dimensionsToChopIn)) {
          // Const assignment.
          const _return = []
          const _StreamCloudKey = []
          const _StreamCreateReadStream = stream.createReadStream()

          /*
           * Create passthrough stream for all
           * dimensions.
           */
          const _TransformedStream = this.configuration.dimensionsToChopIn.map(bake => Sharp()
            .resize(bake.width, bake.height)
            .pipe(_StreamCreateReadStream))

          // Loop over all streams and upload them.
          const _UploadStreams = _TransformedStream.map((k, index) => {
            // Push key for further use.
            _StreamCloudKey.push(Path.join(path, `${this.configuration.dimensionsToChopIn[index].width}*${this.configuration.dimensionsToChopIn[index].height}`, stream.fileName ?? '/'))

            // Return client.
            return _Client_.send(new PutObjectCommand({
              'Bucket': this.configuration.s3.bucketName,
              'ContentLength': k._readableState.length,
              'Key': Path.join(path, `${this.configuration.dimensionsToChopIn[index].width}*${this.configuration.dimensionsToChopIn[index].height}`, stream.fileName ?? '/'),
              'Body': k,
              'ACL': this.configuration.s3.acl
            }))
          })

          // Await all promises.
          const _PromiseUploadStreams = await Promise.all(_UploadStreams)

          /*
           * If uploading all or some files caught exception
           * then report failure.
           */
          if (_.some(_PromiseUploadStreams, k => k instanceof Error)) return _PromiseUploadStreams

          // Loop over all promises and return only resolved one.
          for (const __index in _StreamCloudKey) {
            // Return only resolved promise.
            if (!(_StreamCloudKey[__index] instanceof Error)) {
              _return.push({
                'storage': this.configuration.s3.name,
                'key': _StreamCloudKey[__index],
                'path': this.URI(_StreamCloudKey[__index]),
                'dimensions': this.configuration.dimensionsToChopIn[__index]
              })
            }
          }

          /*
           * Return _return with all images chopped in
           * there respective dimensions.
           */
          return _return
        }

        // Const assignment.
        const _incomingStream = stream.createReadStream()

        // Stream upload given file on cloud.
        _StreamUpload = await _Client_.send(new PutObjectCommand({
          'Bucket': this.configuration.s3.bucketName,
          'Key': `${Path.join(path, stream.fileName ?? '/')}`,
          'Body': _incomingStream,
          'ACL': this.configuration.s3.acl,
          'ContentLength': _incomingStream._readableState.length
        }))

        /*
         * Only return _StreamUpload if
         * uploading didn't contain any error.
         */
        if (_StreamUpload && !(_StreamUpload instanceof Error)) {
          // Return upload.
          return {
            'storage': this.configuration.s3.bucketName,
            'key': Path.join(path, stream.fileName ?? '/'),
            'path': this.URI(Path.join(path, stream.fileName ?? '/')),
            'dimensions': this.configuration.dimensionsToChopIn
          }
        }

        // Report failure.
        return _StreamUpload
      }

      // Report failure.
      return new Error('PLEASE_PROVIDE_LOCATION_TO_UPLOAD')
    } catch (error) {
      // Return error.
      return error
    }
  },

  /*
   * Remove given upload file from given path
   * if is set locally than file will be removed
   * locally else from cloud.
   */
  'RemoveUpload': async function({ storage, path }) {
    /*
     * Only proceed if storage and path
     * both are provided.
     */
    if (!_.isEmpty(storage) && !_.isEmpty(path)) {
      // Local variable.
      let _RemoveUploadFile, _S3Client

      /*
       * Check for storage type if is locally
       * than remove file from local path.
       */
      if (storage.includes('s3')) {
        // Const assignment. // TODO: Fix this upload delete option
        const _endPoint = new Aws.Endpoint(this.configuration.s3.endPoint)

        // S3 instance.
        _S3Client = new Aws.S3({
          'endpoint': _endPoint,
          'accessKeyId': this.configuration.s3.accessKey,
          'secretAccessKey': this.configuration.s3.secretKey
        })

        /*
         * Only successful upload
         * reply to client else report
         * failure.
         */
        if (!_.isEmpty(_S3Client) && !(_S3Client instanceof Error)) {
          /*
           * Remove object from bucket
           * With given name.
           */
          _RemoveUploadFile = await new Promise((__resolve, __reject) =>
          // Upload file stream to cloud
            _S3Client.deleteObject({
              'Bucket': this.configuration.s3.bucketName,
              'Key': path
            }, (error, __data) => error instanceof Error ? __reject(error) : __resolve(__data)))

          /*
           * If remove file from cloud caught error
           * than report failure.
           */
          if (_RemoveUploadFile instanceof Error) return _RemoveUploadFile

          // Else return successful remove.
          return { 'done': true }
        }

        // Report failure.
        return _.isEmpty(_S3Client) ? new Error('REMOVE_FAILED(REMOVEUPLOAD)') : _S3Client
      } else if (storage.includes('local')) {
        // Const assignment.
        _RemoveUploadFile = await Fs.remove(path)

        /*
         * If _removing upload file caught error
         * than report failure.
         */
        if (_RemoveUploadFile instanceof Error) return _RemoveUploadFile

        /*
         * Else remove from server local storage
         * if file not found than return nil as default.
         */
        return { 'done': true }
      }

      // Report failure.
      return new Error('MISSING_STORAGE_LOCATION(REMOVEUPLOAD)')
    }

    // Report failure.
    return new Error('EXPECTED_PATH_AND_STORAGE(REMOVEUPLOAD)')
  }
}
