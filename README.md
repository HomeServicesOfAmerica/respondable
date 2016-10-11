# respondable

A small utility that accepts an object and a callback. The object contains media query descriptions and corresponding return values. The callback is invoked when a query becomes active or innactive and upon initialization. The callback will recieve all of the values associated with active mediaqueries.

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
> `respondable.next` has been exposed and will take the place of `respondable` in the next release.

> Support for default value as a property of the `breakpoints` object has been deprecated. (See Best Practices for more details.)

> Respondable had been passing the value of a single query into the callback when multiple queries matched. Now an array of all matching values will be passed in to the callback.

## Documentation

### respondable.next
> `respondable.next` is the recommended implementation of respondable. It will be available as `respondable` in the next release.

- Parameters: `breakpoints` and  `callback`
- Returns: `destroy`, a function that will remove registered listeners when invoked.

Creates a MediaQueryObjectList for each media query in `breakpoints`. A query becoming active or innactive will invoke `callback`. The callback will also be invoked upon initialization. Callback will recieve all of the values associated with the active mediaqueries.

#### breakpoints <object>

- Keys: Must be media queries excluding the leading characters `@media` as per [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) specs.
- Values: Consumers discretion.

#### callback <function>

- Parameter: `values`

Invoked when a query becomes active or innactive and also when the instance is first initialized. `values` is of type Array and populated with each value (from `breakpoints`) corresponding to a matching query (from `breakpoints`).

###### Example:
```js
const breakpointObject = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const destroy = respondable.next(map, function(values) {
  // use value here
});

// remove registered listeners
destroy();
```

**Benefits of `respondable.next`**
- `Respondable.next` does not have package level state, instances are not aware of eachother. (Doesn't affect consumer.)
- No need for the `respondable.destroy` method

### respondable <function>

- Parameters: `breakpoints` and  `callback` (as seen in `respondable.next`)
- Returns: `id` of type number. Must be passed into `respondable.destroy` in order to remove listeners.

Creates a MediaQueryObjectList for each media query specified in `breakpoints`.
A change in the state of a query will invoke `callback`, passing in all currently matching values.

### respondable.destroy <function>

- Has one parameter: `id` of type number.
- Returns true if deregistration was successful, false otherwise.

If passed a valid id, will remove all registered the MediaQueryList listeners.

###### Example:
```js
const breakpointObject = {
  'screen and (max-width: 413px)': 'smallest',
  'screen and (min-width: 414px) and (max-width: 767px)': 'small',
  'screen and (min-width: 768px) and (max-width: 1079px)': 'medium',
  'screen and (min-width: 1080px) and (max-width: 1399px)': 'large',
  'screen and (min-width: 1400px)': 'largest',
};

const respondableID = respondable(map, function(values) {
  // use value here
});

// remove registered listeners
respondable.destroy(respondableID);
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
