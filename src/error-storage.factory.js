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

