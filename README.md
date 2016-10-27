# respondable

A small utility that makes dealing with media queries programmatically a breeze. `respondable` accepts an object with media query configuration(s) and a callback. The callback will trigger whenever a media query becomes inactive or active, and will have all active media queries passed in.

respondable doesn't use any `resize` event handlers. Instead it relies on the `addListener` method of the `MediaQueryList` object returned by `matchMedia` (see [docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)).

**Note: `matchMedia` is a hard dependency of respondable. It will only work in instances where both `matchMedia` and `matchMedia.addListener` are supported. (Polyfills are available.)**


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
> Instead of returning an ID that needs to be passed into `respondable.destroy`, `respondable` will return a `destroy` function that is already bound to your respondable instance. See the example [below](#example).

> Support for default value as a property of the `breakpoints` object has been deprecated. (See Best Practices for more details.)

> In the previous version, respondable had been passing the value of a single query into the callback when multiple queries matched. Now an array of all matching values will be passed in to the callback.

## Documentation

### respondable
- Parameters: `breakpoints` and  `callback`
- Returns: `destroy`, a function that will remove registered listeners when invoked.

Creates a MediaQueryObjectList for each media query in `breakpoints`. A query becoming active or inactive will invoke `callback`. The callback will also be invoked upon initialization. Callback will recieve all of the values associated with the active media queries.

#### breakpoints <object>

- Keys: Must be media queries excluding the leading characters `@media` as per [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) specs.
- Values: Consumers discretion.

#### callback <function>

- Parameter: `values`

Invoked when a query becomes active or inactive and also when the instance is first initialized. `values` is of type Array and populated with each value (from `breakpoints`) corresponding to a matching query (from `breakpoints`).

###### Example:
```js
const breakpointObject = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const destroy = respondable(map, function(values) {
  // use value here
});

// remove registered listeners
destroy();
```

## Best practices

- While respondable is performant, it is recommended to create only one instance in your app if possible.

- It is recommended to leave no gaps in the `breakpoints` object. It can also be advantageous to set up `breakpoints` in a such a way that there is always a matching query. (Ex: Using breakpoints for 'too small' or 'too big' to cover all of the sizes that aren't meaningful in your application.) This pattern should be more useful than the previously available `default` key in the `breakpoints` object which was only active when there was no matching query.

## Demo

Clone this repo and open `example/demo.html` in your browser to test it out.

## Contributing
Contributions are welcome! Should you decide to contribute we ask you:
- Write code that our linter doesn't hate.
- Write tests that cover any new code and update tests if changes were made to existing code. Code coverage should stay above 90%.
