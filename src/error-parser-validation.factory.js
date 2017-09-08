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
