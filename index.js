(function () {
	'use strict';

  var _state = {};
  var _listeners = {};

  /**
   * While not technically unique, there should be almost zero
   * chance of collisions. Most pages shouldn't have more than
   * a dozen instances of respondable at once.
   * @return {[type]} [description]
   */
  function getUniqueID() {
    return btoa(Math.random() * Math.random());
  }


  /**
   * Returns a state object.
   * @param  {String} id unique ID
   * @return {Object}    state
   */

  function initialState(id, callback) {
    var scopedState = {
      __uniqueID__: id,
      callback: callback,
      active: {},
      status: {},
      _MediaQueryLists: {},
      _rawMediaQueryLists: [],
      _values: {},
      queries: [],
      defaultValue: null
    }
    _state[id] = scopedState;
    return scopedState;
  }

  /**
   * Rough Regex to parse the value from a media query.
   * For example, if the query is '(min-width: 768px)' it
   * should return the number 768.
   *
   * If the value is non-numeric (like with 'orientation')
   * then it will try and match the alphanumeric value instead.
   * @param  {String} query media query
   * @return {String|Number}       parsed value
   * @private
   */
  function getValue(query) {
    var value = query.match(/[0-9]/g)
    if (!value) {
      value = query.match(/\W[a-z]+\)/gi)[0];
      return value.replace(/\)|\W/ig, '');
    }
    value = value.join('');
    return Number(value, 10);
  }


  /**
   * Returns the type of query. For example, if passed
   * '(max-width: 769px)' it should return 'max-width'.
   *
   * @param  {String} query media query
   * @return {String}       query type
   * @private
   */
  function getType(query) {
    var type = query.match(/\([a-z|-]+:/)[0];
    if (!type) return null;
    return type.replace(/\(|:/g, '');
  }


  /**
   * Iterates through all the queries and finds
   * one where `matches === true`. Used when
   * an active query goes below its threshold and
   * a child query might still be valid, but not
   * triggered.
   * @return {String} query description
   * @private
   */
  function findValidActiveQuery(id) {
    var valid = null;
    var state = _state[id];
    state.queries.forEach(function(query) {
    var isValid = state.status[query];
    if (isValid) {
      valid = query;
      return;
    }
  });
  if (!valid) return 'default';
  return valid;
  }



function createQueryListener(id) {
    var listener = function (event) {
			console.log('event passed to listener', event);
      var state = _state[id];
			console.log('active is: ', state.active);
      console.log(state);
      var defaultValue = state.defaultValue;
      var _values = state._values;
      var _MediaQueryLists = state._MediaQueryLists;
      var query = event._media || event.target._media;
      state.status[query] = event.matches;
      var matches = event.matches;
      var isActive = query === state.active.media;


      if (isActive && !matches) {
        var valid = findValidActiveQuery(id);
        console.log('new value', valid);
        var value = valid === 'default' ? defaultValue : _values[valid];
        state.active = valid === 'default' ? valid : _MediaQueryLists[valid];
				console.log('validQuery as as active:', state.active);
        state.callback(value);
      }

      else if (matches) {
       state.active = event.target || event;
			 console.log('the query passed to callback is', query);
			 console.log('values are', _values);
       state.callback(_values[query]);
      }
    }
    _listeners[id] = listener;
    return listener;
  }

  /**
   * Registers a map of queries and return values with the callback.
   * @param  {Object} values  key/value map of queries/return values
   */
  function mapValuesToQueryState(values, state, callback) {

   var _values = state._values = values;
   var defaultValue = state.defaultValue = values.default;
   delete values.default;
   var queries = state.queries = Object.keys(values);
   var _MediaQueryLists = state._MediaQueryLists;
   var status = state.status;
   var listener = createQueryListener(state.__uniqueID__);

   /* Map queries to MediaQueryList objects */
   state._rawMediaQueryLists = queries.map(function(query) {
     var MediaQueryListObject = matchMedia(query);
     MediaQueryListObject._type = getType(query);
     MediaQueryListObject._value = getValue(query);
		 MediaQueryListObject._media = query;
     _MediaQueryLists[query] = MediaQueryListObject;
     status[query] = MediaQueryListObject.matches;
     if (MediaQueryListObject.matches) state.active = MediaQueryListObject;
     MediaQueryListObject.addListener(listener);
     return MediaQueryListObject;
   });

	 if (!state.active) state.active = 'default';

   var initialValue = values[state.active.media];
   if (initialValue === undefined) initialValue = defaultValue;
   callback(initialValue);

 };

 /**
  * Invokes `removeListener` on all the MediaQueryList objects
  * that were created. Resets all internal values to their defaults.
  */

 function destroy(id) {
   var state = _state[id];
   var listener = _listeners[id];

   if (!state) {
     throw new Error('Unable to destroy respondable with id "' + id +
      '": no respondable state found.');
  }

  if (!listener) {
    throw new Error('Unable to destroy respondable with id "' + id +
    '": no listener found.');
  }

   state._rawMediaQueryLists.forEach(function(MediaQueryListObject) {
     MediaQueryListObject.removeListener(listener);
   });
   delete _state[id];
   return true;
 }

 /**
  * Returns the global state if no id is provided. Otherwise returns
  * the state for the passed id.
  * @param  {String} id __uniqueID__
  * @return {Object}    state
  */
 function getState(id) {
   if (id) return _state[id];
   return _state;
 }


 /**
  * Main entry point for respondable. Takes the map of queries/values
  * and the callback function and registers them via MapValuesToState.
  * @param  {Object}   values   queries and values
  * @param  {Function} callback
  * @return {String}            __uniqueID__
  */
 function respondable(values, callback) {

   if (!values || typeof values !== 'object') {
      throw new Error('respondable requires an object as its first argument.');
    }

    if (!callback || typeof callback !== 'function') {
      throw new Error('respondable requiers a callback function as its' +
      'second argument');
    }

    var __uniqueID__ = getUniqueID();
    var state = initialState(__uniqueID__, callback);
    mapValuesToQueryState(values, state, callback);
    return __uniqueID__;
  }

  /* Register `destroy` and `state` as public methods */
  respondable.destroy = destroy;
  respondable.state = getState;

  /* Export! */
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = respondable;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		define('respondable', [], function () {
			return respondable;
		});
	} else {
		window.respondable = respondable;
	}
}());
