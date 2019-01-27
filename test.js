'use strict';

const expect = require('chai').expect;

const bunyanLogger = require('./index'),
      MongoClient = require('mongodb').MongoClient;

const dbName = 'logger-test';
const mongoUrl = `mongodb://localhost/${dbName}`;

describe('bunyan-mongodb-logger', () => {
  let loggerCollection, logger;

  beforeEach('connect to MongoDB', () => {
    return MongoClient.connect(mongoUrl, { useNewUrlParser: true })
      .then((client) => client.db(dbName))
      .then((db) => {
        loggerCollection = db.collection('logs');

        loggerCollection.removeMany({});
      });
  });

  describe('requiring', () => {
    it('should not throw an error', () => {
      expect(() => require('./index')).to.not.throw();
    });
  });

  describe('init', () => {
    it('should throw an error when no logger name is specified', () => {
      expect(() => bunyanLogger({
        stream: 'mongodb',
        url: mongoUrl
      })).to.throw('Missing logger `name` option');
    });

    it('should throw an error when no logger stream is specified', () => {
      expect(() => bunyanLogger({
        name: 'test',
        url: mongoUrl
      })).to.throw('Missing logger `stream` or `streams` options');
    });

    it('should throw an error when no logger streams is specified', () => {
      expect(() => bunyanLogger({
        name: 'test',
        streams: 'mongodb',
        url: mongoUrl
      })).to.throw('Expected `options.streams` to be an Array.');
    });

    it('should create logger with level\'s methods', () => {
      logger = bunyanLogger({
        name: 'test',
        stream: 'mongodb',
        url: mongoUrl
      });

      expect(logger).to.have.property('error');
      expect(logger).to.have.property('info');
      expect(logger).to.have.property('debug');
    });

    describe('when `logger.error` was called', () => {
      beforeEach('create logger with single mongoDB stream', () => {
        logger = bunyanLogger({
          name: 'test',
          stream: 'mongodb',
          url: mongoUrl
        });
      });

      beforeEach('call `logger.error`', () => {
        logger.error(new Error('some error'), 'Some custom message');
      });

      it('should save `log` with selected stream', done => {
        // timeout for inserting error into mongoDB collection
        setTimeout(() => {
          loggerCollection.findOne({})
            .then(result => {
              expect(result).to.have.property('msg', 'Some custom message');
              done();
            })
            .catch(() => done());
        }, 100);
      });

      it('should save `log` with right log level', done => {
        // timeout for inserting error into mongoDB collection
        setTimeout(() => {
          loggerCollection.findOne({})
            .then(result => {
              expect(result).to.have.property('level', 50);
              done();
            })
            .catch(() => done());
        }, 100);
      });
    });
  });
});
