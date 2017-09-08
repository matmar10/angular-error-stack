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
