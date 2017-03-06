[![npm version](https://badge.fury.io/js/respondable.svg)](https://badge.fury.io/js/respondable) [![Build Status](https://travis-ci.org/ConciergeAuctions/respondable.svg?branch=master)](https://travis-ci.org/ConciergeAuctions/respondable) [![Coverage Status](https://coveralls.io/repos/github/ConciergeAuctions/respondable/badge.svg?branch=master)](https://coveralls.io/github/ConciergeAuctions/respondable?branch=master) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/5e57f35560ff437ba63f0b40bea027f4)](https://www.codacy.com/app/Concierge-Auctions/respondable_2?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ConciergeAuctions/respondable&amp;utm_campaign=Badge_Grade) [![Dependencies](https://img.shields.io/david/ConciergeAuctions/respondable.svg)](https://david-dm.org/ConciergeAuctions/respondable#info=dependencies)

# respondable

[![Greenkeeper badge](https://badges.greenkeeper.io/ConciergeAuctions/respondable.svg)](https://greenkeeper.io/)

A small utility that makes dealing with media queries programmatically a breeze. `respondable` accepts an object with media query configuration(s) and a callback. The callback will trigger whenever a media query becomes inactive or active, and will have all active media queries passed in.

respondable doesn't use any `resize` event handlers. Instead it relies on the `addListener` method of the `MediaQueryList` object returned by `matchMedia` (see [docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)).

**Note: `matchMedia` is a hard dependency of respondable.**


## Table of contents
  1. [Installation](#installation)
  2. [Changelog](#changelog)
  3. [Documentation](#documentation)
  4. [Best practices](#best-practices)
  5. [Demo](#demo)
  6. [Contributing](#contributing)


## Installation

`$ npm install --save respondable`

## Changelog
> Respondable now has a 3rd parameter. It is optional and used to specify the priority of each breakpoint. This is only useful for breakpoint configurations with competing queries.

> Instead of returning an ID that needs to be passed into `respondable.destroy`, `respondable` will return a `destroy` function that is already bound to your respondable instance. See the example [below](#example).

> Support for default value as a property of the `breakpoints` object has been deprecated. (See Best Practices for more details.)

> In the previous version, respondable had been passing the value of a single query into the callback when multiple queries matched. Now an array of all matching values will be passed in to the callback.

## Documentation

### Summary
Creates a MediaQueryList for each media query in `breakpoints`. A query becoming active or inactive will invoke `callback`. The callback will also be invoked upon initialization. Callback will receive all of the values associated with the active media queries.

### Parameters
* **breakpoints** (object)
  - Keys: Must be media queries excluding the leading characters `@media` as per [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) specs.
  - Values: Consumers discretion. Strings are recommended.

* **callback** (function)
  - Parameter: `active`
  - Invoked when a query becomes active or inactive and also when the instance is first initialized. `active` is of type Array and populated with each value (from `breakpoints`) corresponding to a matching query (from `breakpoints`).

* **priority** (array)
  - Optional argument. Mainly useful in configurations that contain competing breakpoints (multiple active at a time).
  - Each item in this array must correspond to a value in the breakpoints object and there may be no duplicates. The precedence of each item is dependent on the array's order. The lower the array index of an item is, the higher the priority.

### Returns
* **destroy** (function)
  - A function that will unregister the breakpoint listeners for the instance that returned it.
  - Returns true if unregistration was successful, false for subsequent calls and failure.

## Examples

#### Non-competing breakpoints:
```js
const breakpointObject = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const callback = function(active) {
  // use value here
};

const destroy = respondable(map, callback);

// remove registered listeners
destroy();
```

#### Competing breakpoints:
```js
const breakpointObject = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px)': 'small',
  'screen and (min-width: 768px)': 'medium',
  'screen and (min-width: 1080px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const priority = ['largest', 'large', 'medium', 'small', 'smallest'];

const callback = function(active, largest) {
  // The second parameter will now always be the largest active query.
}

const destroy = respondable(map, callback, priority);

// remove registered listeners
destroy();
```

## Best practices

- While respondable is performant, it is recommended to create only one instance in your app if possible.

- It is recommended to leave no gaps in the `breakpoints` object. It can also be advantageous to set up `breakpoints` in a such a way that there is always a matching query. (Ex: Using breakpoints for 'too small' or 'too big' to cover all of the sizes that aren't meaningful in your application.) This pattern should be more useful than the previously available `default` key in the `breakpoints` object which was only active when there was no matching query.

## Demo

Clone this repo and open `example/demo.html` in your browser to test it out.

## Contributing
Contributions are welcome! Should you decide to contribute we ask that you:
- Write code that our linter doesn't hate.
- Write tests that cover any new code and update tests if changes were made to existing code. We would love it if code coverage stayed at 100%.
