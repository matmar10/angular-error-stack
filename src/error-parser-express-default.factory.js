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
