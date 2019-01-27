'use strict';

const mongoStream = require('stream-to-mongo-db').streamToMongoDB,
      bunyan = require('bunyan');

/**
 * Create Bunyan logger with specified stream.
 *
 * @param {object} options                - logger options
 * @param {string} options.name           - logger name
 * @param {string} [options.stream]       - single stream name
 * @param {[string]} [options.streams]    - stream names array
 * @param {string} [options.level]        - level of logging
 * @param {string} [options.url]          - mongodb stream url
 * @param {string} [options.collections]  - mongodb collection name
 * @param {string} [options.path]         - output file path
 */
module.exports = function (options) {
  if (!options.name) {
    throw new Error('Missing logger `name` option');
  }

  if (!options.streams && !options.stream) {
    throw new Error('Missing logger `stream` or `streams` options');
  }

  if (options.streams && !(options.streams instanceof Array)) {
    throw new Error('Expected `options.streams` to be an Array.');
  }

  if (options.stream) {
    options.streams = [options.stream];
  }

  const streamOptions = [];

  const stdOutStream = {
    level: options.level || 'debug',
    stream: process.stdout
  };

  options.streams.forEach(stream => {
    switch (stream) {
      case 'mongodb':
        const writableStream = mongoStream({
          dbURL : options.url,
          collection : options.collections || 'logs'
        });

        streamOptions.push({
          type: 'raw',
          level: options.level || 'info',
          stream: writableStream
        });
        break;

      case 'file':
        if (!options.path) {
          throw new Error('Missing path option for output file');
        }

        streamOptions.push({
          type: 'rotating-file',
          path: options.path
        });
        break;

      case '$stdout':
        streamOptions.push(stdOutStream);
        break;

      default:
        streamOptions.push(stdOutStream);
    }
  });

  return bunyan.createLogger({
    name: options.name,
    streams: streamOptions,
    serializers: bunyan.stdSerializers
  });
};
