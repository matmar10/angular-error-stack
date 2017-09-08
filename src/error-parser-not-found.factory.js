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
