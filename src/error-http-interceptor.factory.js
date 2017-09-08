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
