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
