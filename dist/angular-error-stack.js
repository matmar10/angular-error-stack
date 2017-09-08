(function () {
  'use strict';
  angular.module('ngErrorStack', []);
})();
/**
 * Utility for easily creating and reporting errors
 *
 * @see http://www.bennadel.com/blog/2828-creating-custom-error-objects-in-node-js-with-error-capturestacktrace.htm
 */
(function () {
  'use strict';
  /**
   * Encapsulates error information
   *
   * @param {object} properties               - Error properties
   * @param {string} properties.title         - Title to show in error dialog [default='Error']
   * @param {string} properties.type          - The type of error [default='Application']
   * @param {string} properties.message       - The error message [default='An error occurred.']
   * @param {string} properties.detail        - Extra information about the error [default='']
   * @param {string} properties.extendedInfo  - Even more information about the error [default='']
   * @param {string} properties.code          - A unique code identifying this error [default='']
   *
   * @typedef {AppError}
   * @property {string} name - The error name to distinguish from default errors [default='AppError']
   * @property {string} type - The type of error [default='Application']
   * @property {string} message - The error message [default='An error occurred.']
   * @property {string} detail - Extra information about the error [default='']
   * @property {string} extendedInfo - Even more information about the error [default='']
   * @property {string} code - A unique code identifying this error [default='']
   * @property {true} isAppError - Boolean flag always true which identifies this as an app error
   * @property {string} trace - The error stack trace
   */
  function AppError(properties) {
    var stackRaw, stackFixed = [];

    // Ensure that properties exists to prevent refernce errors.
    properties = (properties || {});

    // Override the default name property (Error). This is basically zero value-add.
    this.name = 'AppError';

    // Since I am used to ColdFusion, I am modeling the custom error structure on the
    // CFThrow functionality. Each of the following properties can be optionally passed-in
    // as part of the properties argument.
    // --
    // See CFThrow documentation: https://wikidocs.adobe.com/wiki/display/coldfusionen/cfthrow
    this.title = (properties.title || 'Error');
    this.type = (properties.type || 'App');
    this.message = (properties.message || 'An error occurred.');
    this.detail = (properties.detail || '');
    this.extendedInfo = (properties.extendedInfo || '');
    this.code = (properties.code || '');

    // This is just a flag that will indicate if the error is a custom AppError. If this
    // is not an AppError, this property will be undefined, which is a Falsey.
    this.isAppError = true;

    // Capture the current stacktrace and store it in the property "this.stack". By
    // providing the implementationContext argument, we will remove the current
    // constructor (or the optional factory function) line-item from the stacktrace; this
    // is good because it will reduce the implementation noise in the stack property.
    // --
    // https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi#Stack_trace_collection_for_custom_exceptions

    stackRaw = (new Error())
      .stack;
    if (!stackRaw) {
      return;
    }
    stackRaw = stackRaw.split('\n');
    for (var i = 0; i < stackRaw.length; i++) {
      if (-1 === stackRaw[i].indexOf('AppError')) {
        stackFixed.push(stackRaw[i]);
      }
    }
    this.stack = stackFixed.join('\n');
  }

  function appErrorFactory($log) {

    /**
     * Utility to create an application error, log appropriately, and send the info via SomaReportingService
     *
     * @param {object} properties               - Error properties
     * @param {string} properties.title         - Title to show in error dialog [default='Error']
     * @param {string} properties.type          - The type of error [default='App']
     * @param {string} properties.message       - The error message [default='An error occurred.']
     * @param {string} properties.detail        - Extra information about the error [default='']
     * @param {string} properties.extendedInfo  - Even more information about the error [default='']
     * @param {string} properties.code          - A unique code identifying this error [default='']
     * @param {object} options                  - Options for how the error should be treated with logging etc...
     * @param {function} options.reporter       - Additional method to add to send extra reporting, e.g. some 3rd party tool [default=false]
     * @param {string} options.logLevel         - (optional) Level that should be logged via
     *                                              $log[logLevel](); [default='error']
     * @param {string} options.logArgs          - (optional) Additional arguments to be logged via
     *                                              the $log method [default=[]]
     * @return {AppError} New instance of the AppError
     */
    function createAppError(properties, options) {
      /* jshint latedef: true */
      var caller = Function.caller || createAppError,
        err,
        args;
      options = angular.merge({}, {
        logLevel: 'error',
        logArgs: []
      }, options);
      err = (new AppError(properties));
      args = [err].concat(options.logArgs);
      $log[options.logLevel].apply(caller, args);
      if (options.reporter) {
        options.reporter.apply(caller, args);
      }
      return err;
    }

    return createAppError;
  }

  appErrorFactory.$inject = ['$log'];
  angular.module('ngErrorStack').factory('appError', appErrorFactory);
})();

(function () {
  'use strict';
  angular.module('ngErrorStack').constant('ERROR_EVENT', 'error-stack:error');
})();

(function () {
  'use strict';
  function addErrorHttpInterceptor ($httpProvider) {
    $httpProvider.interceptors.push('errorHttpInterceptor');
  }
  addErrorHttpInterceptor.$inject = ['$httpProvider'];
  angular.module('ngErrorStack').config(addErrorHttpInterceptor);
})();
(function () {
  'use strict';
  
  function errorHttpInterceptorFactory($q, errorParser) {
    return {
      responseError: function (rejection) {
        // parse errors using configured parser chain
        errorParser(rejection);
        // return rejection unmodified
        return $q.reject(rejection);
      }
    };
  }

  errorHttpInterceptorFactory.$inject = ['$q', 'errorParser'];
  angular.module('ngErrorStack').service('errorHttpInterceptor', errorHttpInterceptorFactory);
})();

(function () {
  'use strict';

  function authErrorParserFactory($log) {
    return function authErrorParser(err, next) {
      var parsedMessage, message;

      if (401 === err.status) {

        if ('PROMO_CODE_MAX_USES_EXCEEDED' === err.data.code) {
          $log.debug('authErrorParser - promo code max uses exceeded');
          return {
            type: 'App.PromoCode.MaxUsesExceeded',
            message: err.data.message,
            detail: err
          };
        }

        // login attempted
        if (err.config.url.match(/auth\/login/)) {
          $log.debug('authErrorParser - error during login due to invalid credentials');
          return {
            type: 'App.Http.Auth.InvalidLoginError',
            title: 'Invalid Login Details',
            message: 'Invalid username or password provided.',
            detail: err
          };
        }

        // logout attempted; supress this message
        if (err.config.url.match(/auth\/logout/)) {
          $log.debug('authErrorParser - error during logout; supressing error');
          return false;
        }

        message = (err && err.data) ? err.data.message : 'Sorry, you need to login first.';

        // session expired
        // this will be caught by auth error listener
        // which will clear session and redirect to login
        $log.debug('authErrorParser - error due to invalid or expired token');
        return {
          type: 'App.Http.Auth.RequiredError',
          title: 'Login Required',
          message: message,
          detail: err
        };
      }

      // unauthorized action
      if (403 === err.status) {
        if (angular.isString(err.data)) {
          parsedMessage = err.data;
        } else {
          parsedMessage = 'Sorry, you do not have permission to perform that action.';
        }
        return {
          type: 'App.Http.Auth.DeniedError',
          title: 'Permission Denied',
          message: parsedMessage,
          detail: err
        };
      }

      next(err);
    };
  }

  authErrorParserFactory.$inject = ['$log'];
  angular.module('ngErrorStack').factory('errorParserAuth', authErrorParserFactory);
})();

(function () {
  'use strict';

  function connectionRefusedErrorParserFactory() {
    return function connectionRefusedErrorParser(err, next) {

      if (-1 === err.status) {
        return {
          title: 'Cannot Reach Server',
          type: 'App.Http.ConnectionRefusedError',
          message: 'Sorry, we weren\'t able to reach the ReviewMyBill.com server. Please check your internet connection.',
          detail: err
        };
      }

      next(err);
    };
  }
  connectionRefusedErrorParserFactory.$inject = [];
  angular.module('ngErrorStack').factory('errorParserConnectionRefused', connectionRefusedErrorParserFactory);
})();
(function () {
  'use strict';

  function expressDefaultErrorParserFactory() {

    return function expressDefaultErrorParser(err, next) {

      if (angular.isString(err.data)) {
        return {
          type: 'App.RestApi.DefaultError',
          message: err.data,
          extendedInfo: err
        };
      }

      if (!angular.isObject(err.data) ||
        !angular.isObject(err.data) ||
        !angular.isString(err.data.message)) {
        next(err);
        return;
      }
      return {
        type: 'App.RestApi.DefaultError',
        message: err.data.message,
        detail: err.data.code,
        extendedInfo: err
      };
    };
  }

  expressDefaultErrorParserFactory.$inject = [];
  angular.module('ngErrorStack').factory('errorParserExpressDefault', expressDefaultErrorParserFactory);
})();

(function () {
  'use strict';
  
  function notFoundErrorParserFactory() {
    return function notFoundErrorParser(err, next) {
      var message;

      if (404 !== err.status) {
        next(err);
        return;
      }

      if (err.data && err.data.entityName && -1 !== err.data.entityName.indexOf('PromoCode.code')) {
        message = 'Sorry, that promo code is not valid or does not exist.';
      } else {
        message = 'Sorry, we weren\'t able to find that: ' + err.data.message;
      }

      return {
        type: 'App.Http.NotFoundError',
        message: message,
        detail: err
      };
    };
  }

  notFoundErrorParserFactory.$inject = [];
  angular.module('ngErrorStack').factory('errorParserNotFound', notFoundErrorParserFactory);
})();

(function () {

  'use strict';
  
  function validationErrorParserFactory() {
    return function validationErrorParser(err, next) {
      var parsed, fieldErr, i;

      // check for err.data.validations.body[]
      if (err.status !== 400 ||
        !angular.isObject(err.data) ||
        !angular.isArray(err.data.errors)) {
        next(err);
        return;
      }

      parsed = {
        type: 'App.RestApi.ValidationError',
        title: 'Validation Error',
        message: err.data.message || 'We were unable to validate your submission',
        detail: err,
        errors: []
      };

      for (i = 0; i < err.data.errors.length; i++) {
        fieldErr = {
          message: '',
          field: err.data.errors[i].field
        };
        fieldErr.message += err.data.errors[i].messages.join(',');
        parsed.errors.push(fieldErr);
      }

      return parsed;
    };
  }

  validationErrorParserFactory.$inject = [];
  angular.module('ngErrorStack').factory('errorParserValidation', validationErrorParserFactory);
})();

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
(function () {

  'use strict';

  function errorStorageFactory($rootScope, ERROR_EVENT) {
    return function (newError) {

      if (newError) {
        // if error was provided, save and broadcast the event
        $rootScope.error = newError;
        $rootScope.$broadcast(ERROR_EVENT, newError);
      } else if (false === newError || null === newError) {
        // false or null will clear error to be empty
        delete $rootScope.error;
      }

      return $rootScope.error;
    };
  }

  errorStorageFactory.$inject = ['$rootScope', 'ERROR_EVENT'];
  angular.module('ngErrorStack').factory('errorStorage', errorStorageFactory);
})();

