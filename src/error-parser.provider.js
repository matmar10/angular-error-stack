(function () {

  'use strict';

  function ErrorParserProvider() {
    var provider = this;

    this.parsers = [];

    /**
     * Register a new error parser method during config time
     * errors are processed in a pipeline fashion FIFO
     * with the first registered parsers being invoked first
     *
     * @param  {function} parserCallback - The callback to process the error
     * @example
     * errorParserProvider.parser(function (err, next) {
     *   // only handle errors with a specific code
     *   if (1234 !== err.code) {
     *     // pass the error unmodified
     *     next(err);
     *     return;
     *   }
     *   // return the parsed the error
     *   return {
     *     message: 'The dreaded status code 1234 was returned. That is bad.'
     *     detail: err,
     *   };
     * });
     */
    this.parser = function (parserCallback) {
      if (!angular.isFunction(parserCallback)) {
        throw new TypeError('Parser must be a function');
      }
      this.parsers.push(parserCallback);
    };

    this.$get = ['appError', 'errorStorage', function (appError, errorStorage) {

      var service;

      // add one more parser to the end as the default
      provider.parsers.push(function defaultErrorParser(err) {
        if (angular.isString(err)) {
          err = {
            message: err
          };
        }
        if (!angular.isObject(err)) {
          err = {
            extendedInfo: err
          };
        }
        if (!err.type) {
          err.type = 'App.Error';
        }
        if (!err.message) {
          err.message = 'An unexpected error occurred';
        }
        if (!angular.isArray(err.errors)) {
          err.errors = [];
        }
        errorStorage(err);
      });

      /**
       * Processes the given error by piping it through the processing chain
       * @param  {object} originalErr - An error to be parsed by the parser chain
       */
      service = function errorParser(originalErr) {

        function callNextParser(err, atIndex) {
          var parser = provider.parsers[atIndex],
            result;

          // TODO: handle promise returned
          result = parser(originalErr, function (err) {

            // supress error
            if (false === result) {
              return;
            }

            // result already produced, so that's not right
            if (result) {
              throw appError({
                type: 'App.LogicError',
                message: 'next() called for error parser chain but parsed result already returned',
                detail: originalErr,
                extendedInfo: err
              });
            }

            // proceed with next parser in the chain
            // using the potentially modified error structure
            callNextParser(err, atIndex + 1);
          });

          // supress error
          if (false === result) {
            return;
          }

          if (angular.isObject(result)) {
            result.parsed = true;
            errorStorage(result);
          }
        }

        // start the call chain
        callNextParser(originalErr, 0);
      };


      /**
       * Register a new error parser method during config time
       * errors are processed in a pipeline fashion FIFO
       * with the first registered parsers being invoked first
       *
       * @param  {function} parserCallback - The callback to process the error
       * @example
       * errorParser.parser(function (err, next) {
       *   // only handle errors with a specific code
       *   if (1234 !== err.code) {
       *     // pass the error unmodified
       *     next(err);
       *     return;
       *   }
       *   // return the parsed the error
       *   return {
       *     message: 'The dreaded status code 1234 was returned. That is bad.'
       *     detail: err,
       *   };
       * });
       */
      service.parser = function (parser) {
        var position = provider.parsers.length - 1;
        if (position < 0) {
          position = 0;
        }
        provider.parsers.splice(position, 0, parser);
      };

      return service;
    }];
  }

  ErrorParserProvider.$inject = [];
  angular.module('ngErrorStack').provider('errorParser', ErrorParserProvider);
})();