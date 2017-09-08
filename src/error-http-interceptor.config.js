(function () {
  'use strict';
  function addErrorHttpInterceptor ($httpProvider) {
    $httpProvider.interceptors.push('errorHttpInterceptor');
  }
  addErrorHttpInterceptor.$inject = ['$httpProvider'];
  angular.module('ngErrorStack').config(addErrorHttpInterceptor);
})();