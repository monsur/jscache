/*
MIT LICENSE
Copyright (c) 2007 Monsur Hossain (http://monsur.hossai.in)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Local Storage based persistant cache storage backend.
 * If a size of -1 is used, it will purge itself when localStorage
 * is filled. This is 5MB on Chrome/Safari.
 * WARNING: The amortized cost of this cache is very low, however,
 * when a the cache fills up all of localStorage, and a purge is required, it can
 * take a few seconds to fetch all the keys and values in storage.
 * Since localStorage doesn't have namespacing, this means that even if this
 * individual cache is small, it can take this time if there are lots of other
 * other keys in localStorage.
 *
 * @param {string} namespace A string to namespace the items in localStorage. Defaults to 'default'.
 * @constructor
 */
function LocalStorageCacheStorage (namespace) {
  this.prefix_ = 'cache-storage.' + (namespace || 'default') + '.';
  // Regexp String Escaping from http://simonwillison.net/2006/Jan/20/escape/#p-6
  var escapedPrefix = this.prefix_.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  this.regexp_ = new RegExp('^' + escapedPrefix)
}

LocalStorageCacheStorage.prototype.get = function(key) {
  var item = localStorage[this.prefix_ + key];
  if (item) return JSON.parse(item);
  return null;
};

LocalStorageCacheStorage.prototype.set = function(key, value) {
  localStorage[this.prefix_ + key] = JSON.stringify(value);
};

LocalStorageCacheStorage.prototype.size = function(key, value) {
  return this.keys().length;
};

LocalStorageCacheStorage.prototype.remove = function(key) {
  var item = this.get(key);
  delete localStorage[this.prefix_ + key];
  return item;
};

LocalStorageCacheStorage.prototype.keys = function() {
  var ret = [], p;
  for (p in localStorage) {
    if (p.match(this.regexp_)) ret.push(p.replace(this.prefix_, ''));
  };
  return ret;
};

module.exports = LocalStorageCacheStorage;
