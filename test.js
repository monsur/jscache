var TIMEOUT = 50

function assertEqual(a, b) {
  if (a !== b) {
    throw "AssertEqual Failed: " + a + " !== " + b;
  }
}
function assertNotEqual(a, b) {
  if (a === b) {
    throw "AssertEqual Failed: " + a + " !== " + b;
  }
}

function testBasicCaching() {
  var cache = new Cache();
  cache.setItem("foo", "bar");
  assertEqual(cache.getItem("foo"), "bar");
  assertEqual(cache.getItem("missing"), null);
  var stats = cache.getStats();
  assertEqual(stats.hits, 1);
  assertEqual(stats.misses, 1);
  assertEqual(cache.toHtmlString(), "1 item(s) in cache<br /><ul><li>foo = bar</li></ul>");
  assertEqual(cache.count_, 1);

  cache.clear()
  assertEqual(cache.getItem("foo"), null);
  assertEqual(cache.count_, 0);
}

function testAbsoluteExpiration() {
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
  }, TIMEOUT*3);
}

function testSlidingExpiration() {
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
        }, TIMEOUT*3);
      }, TIMEOUT);
    }, TIMEOUT);
  }, TIMEOUT);
}

function testLRUExpiration() {
  var cache = new Cache(2);
  cache.setItem("foo1", "bar1");
  cache.setItem("foo2", "bar2");
  setTimeout(function() {
    // Access an item so foo1 will be the LRU
    assertEqual(cache.getItem("foo2"), "bar2");

    cache.setItem("foo3", "bar3");
    assertEqual(cache.count_, 3);

    // Allow time for cache to be purged
    setTimeout(function() {
      assertEqual(cache.getItem("foo1"), null);
      assertEqual(cache.getItem("foo2"), "bar2");
      assertEqual(cache.getItem("foo3"), "bar3");
      assertEqual(cache.count_, 2);
    }, TIMEOUT)
  }, TIMEOUT)
}

function testPriorityExpiration() {
  var cache = new Cache(2);
  cache.setItem("foo1", "bar1", {
    priority: CachePriority.HIGH
  });
  cache.setItem("foo2", "bar2");
  setTimeout(function() {
    // Access an item so foo1 will be the LRU
    assertEqual(cache.getItem("foo2"), "bar2");

    setTimeout(function() {
      cache.setItem("foo3", "bar3");
      assertEqual(cache.count_, 3);

      // Allow time for cache to be purged
      setTimeout(function() {
        assertEqual(cache.getItem("foo1"), "bar1");
        assertEqual(cache.getItem("foo2"), null);
        assertEqual(cache.getItem("foo3"), "bar3");
        assertEqual(cache.count_, 2);
      }, TIMEOUT)
    }, TIMEOUT)
  }, TIMEOUT)
}

function testResize() {
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
      }, TIMEOUT)
    }, TIMEOUT)
  }, TIMEOUT)
}

function testFillFactor() {
  var cache = new Cache(100);
  var counter = 0;
  for (var i = 1; i <= 100; i++) {
    cache.setItem("foo" + i, "bar" + i);
  }
  assertEqual(cache.count_, 100);
  setTimeout(function() {
    assertEqual(cache.count_, 100);
    cache.setItem("purge", "do it");
    setTimeout(function() {
      assertEqual(cache.count_, 75);
    }, TIMEOUT)
  }, TIMEOUT)
}


console.log("Running tests...")
testBasicCaching();
testAbsoluteExpiration();
testSlidingExpiration();
testLRUExpiration();
testPriorityExpiration();
testResize();
testFillFactor();
setTimeout(function() {
  console.log("All tests passed!")
}, TIMEOUT * 5)
