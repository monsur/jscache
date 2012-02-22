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
 * Basic in memory cache storage backend.
 * @constructor
 */
function BasicCacheStorage() {
  this.items_ = {};
  this.count_ = 0;
}

BasicCacheStorage.prototype.get = function(key) {
  return this.items_[key];
};

BasicCacheStorage.prototype.set = function(key, value) {
  if (typeof this.get(key) === "undefined")
    this.count_++;
  this.items_[key] = value;
};

BasicCacheStorage.prototype.size = function(key, value) {
  return this.count_;
};

BasicCacheStorage.prototype.remove = function(key) {
  var item = this.get(key);
  if (typeof item !== "undefined")
    this.count_--;
  delete this.items_[key];
  return item;
};

BasicCacheStorage.prototype.keys = function() {
  var ret = [], p;
  for (p in this.items_) ret.push(p);
  return ret;
};

module.exports = BasicCacheStorage;
