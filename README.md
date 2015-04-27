cachai
======

> LRU Cache for Node.js

[![Build Status](https://secure.travis-ci.org/rstuven/node-cachai.png?branch=master)](http://travis-ci.org/rstuven/node-cachai)
[![Coverage Status](https://coveralls.io/repos/rstuven/node-cachai/badge.svg)](https://coveralls.io/r/rstuven/node-cachai)
[![dependencies Status](https://david-dm.org/rstuven/node-cachai.svg)](https://david-dm.org/rstuven/node-cachai#info=dependencies)
[![devDependencies Status](https://david-dm.org/rstuven/node-cachai/dev-status.svg)](https://david-dm.org/rstuven/node-cachai#info=devDependencies)


This is a fork of Monsur Hossain's jscache for browsers, which is loosely based on ASP.NET's Cache, and includes many caching options such as absolute expiration, sliding expiration, cache priority, and a callback function on purge.


Install
-------

    npm install --save cachai


Usage
-----

First, create a new cache object.
The constructor accepts an optional integer
parameter which places a limit on how many
items the cache holds.
Example:
``` javascript
var Cache = require('cachai');

var cache = new Cache();
```

### Methods

`setItem` adds an item to the cache. Arguments:
- `key`: 		 	key to refer to the object
- `value`: 	 	object to cache
- `options`:	optional parameters described below

Options available are:

- `expirationAbsolute`:
The datetime when the item should expire

- `expirationSliding`:
An integer representing the seconds since
the last cache access after which the item
should expire

- `priority`:
How important it is to leave this item in the cache.
You can use the values Cache.Priority.LOW, .NORMAL, or
.HIGH, or you can just use an integer.  Note that
placing a priority on an item does not guarantee
it will remain in cache.  It can still be purged if
an expiration is hit, or if the cache is full.

- `onPurge`:
A function that gets called when the item is purged
from cache.  The key and value of the removed item
are passed as parameters to the callback function.

Example:
``` javascript
cache.setItem("A", "1", {
	expirationAbsolute: null,
	expirationSliding: 60,
	priority: Cache.Priority.HIGH,
	onPurge: function(k, v) { console.log('removed', k, v); }
});
```

`getItem` retrieves an item from the cache
takes one parameter, the key to retrieve
returns the cached item.
Example:
``` javascript
var item = cache.getItem("A");
```

`removeItem` removes and returns an item from the cache.
If the item doesn't exist it returns null.
Example:
``` javascript
var removed = cache.removeItem("A");
```

`size` returns the number of items in the cache.
Example:
``` javascript
var size = cache.size();
```

`stats` returns stats about the cache, like `{"hits": 1, "misses": 4}`.
Example:
``` javascript
console.dir(cache.stats());
```

`clear` removes all items from the cache.
Example:
``` javascript
cache.clear();
```
