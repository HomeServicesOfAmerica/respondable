# respondable

__under development__

A small utility that lets you pass in media query descriptions and corresponding return values that will be invoked with a registered handler.

respondable doesn't use any `resize` event handlers anywhere. Instead it relies on the `addListener` method of the `MediaQueryList` object returned by `matchMedia`.

**Note: `matchMedia` is a hard dependency of respondable. It will only work in instances where both `matchMedia` and `matchMedia.addListener` are supported.**


## Usage


```js

var map = {
   '(min-width: 414px)': 'small',
   '(min-width: 768px)': 'medium',
   '(min-width: 1080px)': 'large',
   '(min-width: 1400px)': 'extra-large',
   default: 'default value'
};

respondable(map, function(data) {
  // use value here
});

```

A single function, `respondable`, is exported with the signature `respondable(values, callback)`, where `values` is your map of media queries
and their respective values, and `callback` is the function invoked when those
queries change.


`respondable` returns an id that can be used to remove all the registered listeners for that scope by passing it to `respondable.destroy`

```js

var id = respondable(map, function(data) {
  // use value here
});

respondable.destroy(id);

```

## Example

Just clone this repo and open the `test.html` file in your browser to test it out.



## Warnings

This repo is still in the early stages of development. There are a few things to keep in mind:

* Its only really been tested using `min-width`, with a mobile-first approach.
* The queries should be in ascending order, by `px`
* Competing queries may unexpectedly overwrite each other.
