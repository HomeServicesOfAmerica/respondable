(function () {
	'use strict';

  var handlers = [];
  var active = {};
  var status = {};
  var _MediaQueryLists = {};
  var _rawMediaQueryLists = [];
  var _values = {};
  var queries = [];
  var handler = null;
  var defaultValue = null;


  /**
   * Registers a handler function. This is invoked
   * whenever one of the MediaQueryList changes. It
   * is passed the value matching the query, which
   * is set in the `register` call.
   * @param {Function} callback event handler
   */
  function addHandler(callback) {
    handler = callback;
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
  function findValidActiveQuery() {
    var valid = null;
    queries.forEach(function(query) {
    var isValid = status[query];
    if (isValid) {
      valid = query;
      return;
    }
  });
  if (!valid) return 'default';
  return valid;
  }


  /**
   * Passed to MediaQuerylist.addListener. Invoked
   * when the MediaQueryList.matches property changes.
   * @param  {MediaQueryListEvent} event MediaQueryListEvent
   * @private
   */
  function mediaQueryListener(event) {
    var query = event.media;
    status[query] = event.matches;
    var matches = event.matches;
    var isActive = query === active.media;
    if (isActive && !matches) {
      var valid = findValidActiveQuery();
      var value = valid === 'default' ? defaultValue : _values[valid];
      active = valid === 'default' ? valid : _MediaQueryLists[valid];
      handler(value);
    }

    else if (matches) {
     active = event.target;
     handler(_values[query]);
    }
  }


  /**
   * Registers a map of queries and return values with the handler.
   * @param  {Object} values  key/value map of queries/return values
   */
  function register(values) {


   if (typeof handler !== 'function') {
     throw new Error('Please register a handler function as `respondable.handler` before calling `respondable.register`.');
   }

   _values = values;
   defaultValue = values.default;
   delete values.default;
   queries = Object.keys(values);

   _rawMediaQueryLists = queries.map(function(query) {

     var MediaQueryListObject = matchMedia(query);
     MediaQueryListObject._type = getType(query);
     MediaQueryListObject._value = getValue(query);
     _MediaQueryLists[query] = MediaQueryListObject;
     status[query] = MediaQueryListObject.matches;
     if (MediaQueryListObject.matches) active = MediaQueryListObject;
     MediaQueryListObject.addListener(mediaQueryListener);
     return MediaQueryListObject;
   });

   var initialValue = values[active.media];
   if (initialValue === undefined) initialValue = defaultValue;
   handler(initialValue);
 };


 /**
  * Invokes `removeListener` on all the MediaQueryList objects
  * that were created. Resets all internal values to their defaults.
  */

 function destroy() {
   _rawMediaQueryLists.forEach(function(MediaQueryListObject) {
     MediaQueryListObject.removeListener(mediaQueryListener);
   });

   handlers = [];
   active = {};
   status = {};
   _MediaQueryLists = {};
   _rawMediaQueryLists = [];
   _values = {};
   queries = [];
   handler = null;
   defaultValue = null;

 }


  var respondable =  {
    register,
    destroy,
    addHandler,
    handlers,
    active,
    status,
    _MediaQueryLists,
    queries,
    handler,
    defaultValue
  }



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
