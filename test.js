'use strict';

var expect = require('chai').expect;

var bunyanLogger = require('./index'),
    MongoClient = require('mongodb').MongoClient;

var mongoUrl = 'mongodb://localhost/logger-test';

describe('bunyan-mongodb-logger', function () {
  var loggerCollection, options, logger;

  beforeEach(function (done) {
    MongoClient.connect(mongoUrl, function (err, db) {
      if (err) {
        return done(err);
      }

      loggerCollection = db.collection('logs');
      loggerCollection.remove({}, done);
    });
  });

  describe('requiring', function () {
    it('should not throw an error', function () {
      expect(function () {
        return require('./logger-lib');
      }).to.not.throw();
    });
  });

  describe.only('init', function () {
    it('should throw an error when no logger name is specified', function () {
      expect(function () {
        return bunyanLogger({
          stream: 'mongodb',
          url: mongoUrl
        });
      }).to.throw('Missing logger `name` option');
    });

    it('should throw an error when no logger stream is specified', function () {
      expect(function () {
        return bunyanLogger({
          name: 'test',
          url: mongoUrl
        });
      }).to.throw('Missing logger `stream` or `streams` options');
    });

    it('should throw an error when no logger streams is specified', function () {
      expect(function () {
        return bunyanLogger({
          name: 'test',
          streams: 'mongodb',
          url: mongoUrl
        });
      }).to.throw('Expected `options.streams` to be an Array.');
    });

    it('should create logger with level\'s methods', function () {
      logger = bunyanLogger({
        name: 'test',
        stream: 'mongodb',
        url: mongoUrl
      });

      expect(logger).to.have.property('error');
      expect(logger).to.have.property('info');
      expect(logger).to.have.property('debug');
    });

    describe('when `logger.error` was called', function () {
      beforeEach('create logger with single mongoDB stream', function () {
        logger = bunyanLogger({
          name: 'test',
          stream: 'mongodb',
          url: mongoUrl
        });
      });

      beforeEach('call `logger.error`', function () {
        logger.error(new Error('some error'), 'Some custom message');
      });

      it('should save `log` with selected stream', function (done) {
        // timeout for inserting error into mongoDB collection
        setTimeout(function () {
          loggerCollection.findOne({})
            .then(function (result) {
              expect(result).to.have.property('msg', 'Some custom message');
              done();
            })
            .catch(function (err) {
              return done(err);
            });
        }, 200);
      });
    });
  });
});
