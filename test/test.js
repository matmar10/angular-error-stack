'use strict';

(function () {

  angular.module('testApp', [
    'ngErrorStack'
  ]);

  function registerErrorParsers(
    errorParser,
    // various error parser methods
    errorParserAuth,
    errorParserConnectionRefused,
    errorParserExpressDefault,
    errorParserValidation,
    errorParserNotFound) {

    // HTTP - handle login invalid credentials error
    errorParser.parser(errorParserAuth);

    // HTTP - handle URL not found errors
    errorParser.parser(errorParserNotFound);

    // HTTP - server is down or no connection
    errorParser.parser(errorParserConnectionRefused);

    // turn JSON schema validation into form-field appropriate validation
    errorParser.parser(errorParserValidation);

    // default unmarshaled express server error
    errorParser.parser(errorParserExpressDefault);

    // default error parser runs if none of the above had any effect
  }

  registerErrorParsers.$inject = [
    'errorParser',
    'errorParserAuth',
    'errorParserConnectionRefused',
    'errorParserExpressDefault',
    'errorParserNotFound',
    'errorParserValidation'
  ];

  angular.module('testApp').run(registerErrorParsers);
})();