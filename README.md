JavaScript LRU Cache
====================

Just a simple LRU cache written in javascript. It is loosely based on ASP.NET's Cache, and includes many caching options such as absolute expiration, sliding expiration, cache priority, and a callback function. It can be used to cache data locally in the user's browser, saving a server roundtrip in AJAX heavy applications.

How It Works
------------

		// Create a new cache item
		// The constructor accepts an optional integer
		// parameter which places a limit on how many
		// items the cache holds
		var cache = new Cache();

		// add an item to the cache
		// parameters: key - the key to refer to the object
		//             value - the object to cache
		//             options - an optional parameter described below
		// the last parameter accepts an object which controls various caching options:
		//      expirationAbsolute: the datetime when the item should expire
		//      expirationSliding: an integer representing the seconds since
		//                         the last cache access after which the item
		//                         should expire
		//      priority: How important it is to leave this item in the cache.
		//                You can use the values Cache.Priority.LOW, .NORMAL, or
		//                .HIGH, or you can just use an integer.  Note that
		//                placing a priority on an item does not guarantee
		//                it will remain in cache.  It can still be purged if
		//                an expiration is hit, or if the cache is full.
		//      callback: A function that gets called when the item is purged
		//                from cache.  The key and value of the removed item
		//                are passed as parameters to the callback function.
		cache.setItem("A", "1", {expirationAbsolute: null,
		                         expirationSliding: 60,
		                         priority: Cache.Priority.HIGH,
		                         callback: function(k, v) { alert('removed ' + k); }
		                        });

		// retrieve an item from the cache
		// takes one parameter, the key to retreive
		// returns the cached item
		cache.getItem("A");

		// Remove and return an item from the cache.
		// If the item doesn't exist it returns null.
		cache.removeItem("A");
		
		// Removes items from the cache which pass the provided test.
		// If the test function returns true, the item will be removed.
		// E.g., Remove keys which start with 'RemoveMe'
		cache.removeWhere(function(k, v) { return /^RemoveMe/.test(k); });

		// Returns the number of items in the cache.
		cache.size();

		// Return stats about the cache, like {"hits": 1, "misses": 4}
		cache.stats();

		// clears all items from the cache
		cache.clear();

LocalStorage Persistance
------------------------

You can have the cache persist its values to localStorage on browsers that support it.
To do this simply create the cache with a different storage backend like:

    var cache = new Cache(-1, false, new Cache.LocalStorageCacheStorage());

All values have to be JSON stringifiable, which means the callback option to setItem won't work.

If you want to have multiple independent caches, pass in a namespace argument, like:

    var cache = new Cache(-1, false, new Cache.LocalStorageCacheStorage('myNameSpace'));

If -1 is used for the cache size, the cache will be limited to the size of localStorage,
which is currently 5MB on Chrome/Safari.


History
-------
* 4/16/2013: Thanks to [Nick Young](https://github.com/nickwb) for AMD module support and the removeWhere() method.
* 11/29/2011: Thanks to Andrew Carman for tests, pluggable backends, localStorage persistance, and bug fixes.
* 1/8/2011: Migrated project to GitHub.
* 1/20/2010: Thanks to Andrej Arn for some syntax updates.
* 5/30/2008: First version.
