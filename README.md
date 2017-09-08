# angular-error-stack

Handle Angular events using an error middleware stack similar to express

## Installation

Add to your project:

```
bower install --save angular-error-stack
```

Add `ngErrorStack` as a dependency of your module:

```
angular.module('yourApp', [
  'ngErrorStack'
])
```

# Register Middleware

Which middleware you use, including any custom middleware defined by you
is completely left up to your choosing. Some defaults are provided, but left
unregistered.

To register middleware:

```
angular.module('yourApp').run(function (errorParser, ) {

});
```

# Services

## errorParser

Manages the middleware stack. Allows registration of new middleware:

```
errorParser.parser(function (err, next) {

  if (!angular.isString(err.message) || !err.message.match(/manners)) {
    next(err);
    return;
  }

  return {
    type: 'BadMannersError',
    message: 'Sorry, that is bad manners!',
    detail: 'Elbows on the table',
    extendedInfo: err
  };
});
```

** SEE `test/test.js` in this project for an example of how to use all
default middleware.**

