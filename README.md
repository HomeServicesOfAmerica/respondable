# respondable

__under development__

A small utility that lets you pass in media query descriptions and corresponding return values that will be invoked with a registered handler.

respondable doesn't use any `resize` event handlers anywhere. Instead it relies on the `addListener` method of the `MediaQueryList` object returned by `matchMedia`.

**Note: `matchMedia` is a hard dependency of respondable. It will only work in instances where both `matchMedia` and `matchMedia.addListener` are supported.**


## Usage

You must first register an event handler with respondable.

```js

import respondable from 'respondable';

respondable.addHandler((data) => {
  // use the active data value here.
})

```


You can then call `respondable.register` to pass a object mapping your queries and their return values.

```js

respondable.register({
  '(min-width: 414px)': someDataSource.small,
  '(min-width: 768px)': someDataSource.medium,
  '(min-width: 1024px)': someDataSource.large,
});

```

Finally, you can call `respondable.destroy` to remove all the listeners registered with the `MediaQueryList` objects and reset all internal
values to their defaults.


## Example

Just clone this repo and open the `test.html` file in your browser to test it out.



## Warnings

This repo is still in the early stages of development. There are a few things to keep in mind:

* Its only really been tested using `min-width`, with a mobile-first approach.
* The queries should be in ascending order, by `px`
* Competing queries may unexpectedly overwrite each other.
