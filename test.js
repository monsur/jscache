var TIMEOUT = 50
function assertEqual(a, b) {
  if (a !== b) {
    throw "AssertEqual Failed: " + a + " !== " + b;
  }
}

function testBasicCaching(done) {
  var cache = new Cache();
  cache.setItem("foo", "bar");
  assertEqual(cache.getItem("foo"), "bar");
  assertEqual(cache.getItem("missing"), null);
  assertEqual(cache.removeItem("missing"), null);
  var stats = cache.getStats();
  assertEqual(stats.hits, 1);
  assertEqual(stats.misses, 1);
  assertEqual(cache.toHtmlString(), "1 item(s) in cache<br /><ul><li>foo = bar</li></ul>");
  assertEqual(cache.size(), 1);


  cache.setItem("foo2", "bar2");
  assertEqual(cache.size(), 2);
  assertEqual(cache.removeItem("foo"), "bar");
  assertEqual(cache.size(), 1);
  cache.clear();
  assertEqual(cache.getItem("foo"), null);
  assertEqual(cache.size(), 0);
  done();
}

function testAbsoluteExpiration(success) {
  var cache = new Cache();
  cache.setItem("foo", "bar", {
    expirationAbsolute: new Date(new Date().getTime() + TIMEOUT*2)
  });
  assertEqual(cache.getItem("foo"), "bar");

  setTimeout(function() {
    assertEqual(cache.getItem("foo"), "bar");
  }, TIMEOUT);
  setTimeout(function() {
    assertEqual(cache.getItem("foo"), null);
    success();
  }, TIMEOUT*3);
}

function testSlidingExpiration(success) {
  var cache = new Cache();
  cache.setItem("foo", "bar", {
    expirationSliding: TIMEOUT * 2 / 1000
  });
  assertEqual(cache.getItem("foo"), "bar");

  setTimeout(function() {
    assertEqual(cache.getItem("foo"), "bar");
    setTimeout(function() {
      assertEqual(cache.getItem("foo"), "bar");
      setTimeout(function() {
        assertEqual(cache.getItem("foo"), "bar");
        setTimeout(function() {
          assertEqual(cache.getItem("foo"), null);
          success();
        }, TIMEOUT*3);
      }, TIMEOUT);
    }, TIMEOUT);
  }, TIMEOUT);
}

function testLRUExpiration(success) {
  var cache = new Cache(2);
  cache.setItem("foo1", "bar1");
  cache.setItem("foo2", "bar2");
  setTimeout(function() {
    // Access an item so foo1 will be the LRU
    assertEqual(cache.getItem("foo2"), "bar2");

    cache.setItem("foo3", "bar3");
    assertEqual(cache.size(), 3);

    // Allow time for cache to be purged
    setTimeout(function() {
      assertEqual(cache.getItem("foo1"), null);
      assertEqual(cache.getItem("foo2"), "bar2");
      assertEqual(cache.getItem("foo3"), "bar3");
      assertEqual(cache.size(), 2);
      success();
    }, TIMEOUT)
  }, TIMEOUT)
}

function testPriorityExpiration(success) {
  var cache = new Cache(2);
  cache.setItem("foo1", "bar1", {
    priority: Cache.Priority.HIGH
  });
  cache.setItem("foo2", "bar2");
  setTimeout(function() {
    // Access an item so foo1 will be the LRU
    assertEqual(cache.getItem("foo2"), "bar2");

    setTimeout(function() {
      cache.setItem("foo3", "bar3");
      assertEqual(cache.size(), 3);

      // Allow time for cache to be purged
      setTimeout(function() {
        assertEqual(cache.getItem("foo1"), "bar1");
        assertEqual(cache.getItem("foo2"), null);
        assertEqual(cache.getItem("foo3"), "bar3");
        assertEqual(cache.size(), 2);
        success();
      }, TIMEOUT)
    }, TIMEOUT)
  }, TIMEOUT)
}

function testResize(success) {
  var cache = new Cache();
  cache.setItem("foo1", "bar1");
  setTimeout(function() {
    cache.setItem("foo2", "bar2");
    setTimeout(function() {
      cache.setItem("foo3", "bar3");
      cache.resize(2);
      assertEqual(cache.getItem("foo1"), null);
      assertEqual(cache.getItem("foo2"), "bar2");
      setTimeout(function() {
        assertEqual(cache.getItem("foo3"), "bar3");
        cache.resize(1);
        assertEqual(cache.getItem("foo1"), null);
        assertEqual(cache.getItem("foo2"), null);
        assertEqual(cache.getItem("foo3"), "bar3");
        success();
      }, TIMEOUT)
    }, TIMEOUT)
  }, TIMEOUT)
}

function testFillFactor(success) {
  var cache = new Cache(100);
  var counter = 0;
  for (var i = 1; i <= 100; i++) {
    cache.setItem("foo" + i, "bar" + i);
  }
  assertEqual(cache.size(), 100);
  setTimeout(function() {
    assertEqual(cache.size(), 100);
    cache.setItem("purge", "do it");
    setTimeout(function() {
      assertEqual(cache.size(), 75);
      success();
    }, TIMEOUT)
  }, TIMEOUT)
}

function testLocalStorageCache(success) {
  localStorage.clear();
  var cache = new Cache(2, false, new Cache.LocalStorageCacheStorage());
  cache.setItem("foo1", "bar1");
  assertEqual(cache.getItem("foo1"), "bar1");
  assertEqual(cache.getItem("missing"), null);
  var stats = cache.getStats();
  assertEqual(stats.hits, 1);
  assertEqual(stats.misses, 1);
  assertEqual(cache.toHtmlString(), "1 item(s) in cache<br /><ul><li>foo1 = bar1</li></ul>");
  assertEqual(cache.size(), 1);
  assertEqual(localStorage.length, 1);

  setTimeout(function() {
    cache.setItem("foo2", "bar2");
    cache.setItem("foo3", "bar3");
    setTimeout(function() {
      assertEqual(cache.size(), 2);
      assertEqual(localStorage.length, 2);

      cache.clear();
      assertEqual(cache.getItem("foo1"), null);
      assertEqual(cache.getItem("foo2"), null);
      assertEqual(cache.getItem("foo3"), null);
      assertEqual(cache.size(), 0);
      assertEqual(localStorage.length, 0);
      success();
    }, TIMEOUT)
  }, TIMEOUT)
}

function testLocalStorageExisting(success) {
  localStorage.clear();
  var cache = new Cache(-1, false, new Cache.LocalStorageCacheStorage());
  cache.setItem("foo", "bar");
  var cache2 = new Cache(-1, false, new Cache.LocalStorageCacheStorage());
  assertEqual(cache.size(), 1);
  assertEqual(cache2.size(), 1);
  cache.removeItem("foo");
  assertEqual(cache.size(), 0);
  assertEqual(cache2.size(), 0);
  success();
}

function testLocalStorageCacheMaxSize(success) {
  localStorage.clear();
  var cache = new Cache(-1, false, new Cache.LocalStorageCacheStorage());
  var count = 0;
  console.log('Attempting to max out localStorage, this may take a while...')
  while (true) {
    count += 1;
    var startSize = localStorage.length;
    if (count % 500 === 0) {
      console.log('   added ' + count + ' items')
    }
    cache.setItem("somelongerkeyhere" + count, Array(200).join("bar") + count);
    if (localStorage.length - startSize < 0) {
      console.log('   added ' + count + ' items')
      localStorage.clear();
      return success();
    }
  }
}

function testRemoveWhere(success) {
	var cache = new Cache();
	cache.setItem('Adam', 1);
	cache.setItem('Andrew', 2);
	cache.setItem('Bob', 4);
	
	var itemSum = 0;
	
	// Remove items if they key starts with 'A'
	cache.removeWhere(function(key, value) {
		itemSum += value;
		return /^A/.test(key);
	});
	
	assertEqual(cache.size(), 1);
	assertEqual(cache.getItem('Adam'), null);
	assertEqual(cache.getItem('Andrew'), null);
	assertEqual(cache.getItem('Bob'), 4);
	assertEqual(itemSum, 7);
}

function runTests(tests) {
  if (tests.length === 0) return console.log("All tests passed!");
  var next = tests.shift();
  next(function() {
    runTests(tests);
  })
}

console.log("Running tests...");
runTests([
  testBasicCaching,
  testAbsoluteExpiration,
  testSlidingExpiration,
  testLRUExpiration,
  testPriorityExpiration,
  testResize,
  testFillFactor,
  testLocalStorageCache,
  testLocalStorageExisting,
  testLocalStorageCacheMaxSize,
  testRemoveWhere
]);
