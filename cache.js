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
 * An easier way to refer to the priority of a cache item
 * @enum {number}
 */
var CachePriority = {
  'LOW': 1,
  'NORMAL': 2,
  'HIGH': 4
};


/**
 * Creates a new Cache object.
 * @param {number} maxSize The maximum size of the cache (or -1 for no max).
 * @param {boolean} debug Whether to log events to the console.log.
 * @constructor
 */
function Cache(maxSize, debug) {
    this.maxSize_ = maxSize || -1;
    this.debug_ = debug || false;
    this.items_ = {};
    this.count_ = 0;

    var fillFactor = .75;
    this.purgeSize_ = Math.round(this.maxSize_ * fillFactor);

    this.stats_ = {};
    this.stats_['hits'] = 0;
    this.stats_['misses'] = 0;
    this.log_('Initialized cache with size ' + maxSize);
}


/**
 * Retrieves an item from the cache.
 * @param {string} key The key to retrieve.
 * @return {Object} The item, or null if it doesn't exist.
 */
Cache.prototype.getItem = function(key) {

  // retrieve the item from the cache
  var item = this.items_[key];

  if (item != null) {
    if (!this.isExpired_(item)) {
      // if the item is not expired
      // update its last accessed date
      item.lastAccessed = new Date().getTime();
    } else {
      // if the item is expired, remove it from the cache
      this.removeItem_(key);
      item = null;
    }
  }

  // return the item value (if it exists), or null
  var returnVal = item ? item.value : null;
  if (returnVal) {
    this.stats_['hits']++;
    this.log_('Cache HIT for key ' + key)
  } else {
    this.stats_['misses']++;
    this.log_('Cache MISS for key ' + key)
  }
  return returnVal;
};


Cache._CacheItem = function(k, v, o) {
    if ((k == null) || (k == '')) {
				throw new Error("key cannot be null or empty");
    }
    this.key = k;
    this.value = v;
    if (o == null) {
				o = {};
    }
    if (o.expirationAbsolute != null) {
				o.expirationAbsolute = o.expirationAbsolute.getTime();
    }
    if (o.priority == null) {
				o.priority = CachePriority.NORMAL;
    }
    this.options = o;
    this.lastAccessed = new Date().getTime();
};


/**
 * Sets an item in the cache.
 * @param {string} key The key to refer to the item.
 * @param {Object} value The item to cache.
 * @param {Object} options an optional object which controls various caching
 *    options:
 *      expirationAbsolute: the datetime when the item should expire
 *      expirationSliding: an integer representing the seconds since
 *                         the last cache access after which the item
 *                         should expire
 *      priority: How important it is to leave this item in the cache.
 *                You can use the values CachePriority.Low, .Normal, or 
 *                .High, or you can just use an integer.  Note that 
 *                placing a priority on an item does not guarantee 
 *                it will remain in cache.  It can still be purged if 
 *                an expiration is hit, or if the cache is full.
 *      callback: A function that gets called when the item is purged
 *                from cache.  The key and value of the removed item
 *                are passed as parameters to the callback function.
 */
Cache.prototype.setItem = function(key, value, options) {

  // add a new cache item to the cache
  if (this.items_[key] != null) {
    this.removeItem_(key);
  }
  this.addItem_(new Cache._CacheItem(key, value, options));
  this.log_("Setting key " + key);

  // if the cache is full, purge it
  if ((this.maxSize_ > 0) && (this.count_ > this.maxSize_)) {
    var that = this;
    setTimeout(function() {
      that.purge_.call(that);
    }, 0);
  }
};


/**
 * Removes all items from the cache.
 */
Cache.prototype.clear = function() {
  // loop through each item in the cache and remove it
  for (var key in this.items_) {
    this.removeItem_(key);
  }
  this.log_('Cache cleared');
};


/**
 * @return {Object} The hits and misses on the cache.
 */
Cache.prototype.getStats = function() {
  return this.stats_;
};


/**
 * @return {string} Returns an HTML string representation of the cache.
 */
Cache.prototype.toHtmlString = function() {
  var returnStr = this.count_ + " item(s) in cache<br /><ul>";
  for (var key in this.items_) {
    var item = this.items_[key];
    returnStr = returnStr + "<li>" + item.key.toString() + " = " +
        item.value.toString() + "</li>";
  }
  returnStr = returnStr + "</ul>";
  return returnStr;
};


/**
 * Removes expired items from the cache.
 */
Cache.prototype.purge_ = function() {

  var tmparray = new Array();

  // loop through the cache, expire items that should be expired
  // otherwise, add the item to an array
  for (var key in this.items_) {
    var item = this.items_[key];
    if (this.isExpired_(item)) {
      this.removeItem_(key);
    } else {
      tmparray.push(item);
    }
  }

  if (tmparray.length > this.purgeSize_) {

    // sort this array based on cache priority and the last accessed date
    tmparray = tmparray.sort(function(a, b) { 
      if (a.options.priority != b.options.priority) {
        return b.options.priority - a.options.priority;
      } else {
        return b.lastAccessed - a.lastAccessed;
      }
    });

    // remove items from the end of the array
    while (tmparray.length > this.purgeSize_) {
      var ritem = tmparray.pop();
      this.removeItem_(ritem.key);
    }
  }
  this.log_('Purged cached');
};


/**
 * Add an item to the cache.
 * @param {Object} item The cache item to add.
 * @private
 */
Cache.prototype.addItem_ = function(item) {
  this.items_[item.key] = item;
  this.count_++;
};


/**
 * Remove an item from the cache, call the callback function (if it exists).
 * @param {String} key The key of the item to remove
 * @private
 */
Cache.prototype.removeItem_ = function(key) {
  var item = this.items_[key];
  delete this.items_[key];
  this.count_--;
  this.log_("removed key " + key);

  // if there is a callback function, call it at the end of execution
  if (item.options.callback != null) {
    setTimeout(function() {
      item.options.callback.call(null, item.key, item.value);
    }, 0);
  }
};


/**
 * @param {Object} item A cache item.
 * @return {boolean} True if the item is expired
 * @private
 */
Cache.prototype.isExpired_ = function(item) {
  var now = new Date().getTime();
  var expired = false;
  if (item.options.expirationAbsolute &&
      (item.options.expirationAbsolute < now)) {
      // if the absolute expiration has passed, expire the item
      expired = true;
  } 
  if (!expired && item.options.expirationSliding) {
    // if the sliding expiration has passed, expire the item
    var lastAccess =
        item.lastAccessed + (item.options.expirationSliding * 1000);
    if (lastAccess < now) {
      expired = true;
    }
  }
  return expired;
};


/**
 * Logs a message to the console.log if debug is set to true.
 * @param {string} msg The message to log.
 * @private
 */
Cache.prototype.log_ = function(msg) {
  if (this.debug_) {
    console.log(msg);
  }
};

if(module)
		module.exports = Cache;