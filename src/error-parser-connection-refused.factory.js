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