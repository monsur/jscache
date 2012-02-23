Cache = require '../'
sinon = require 'sinon'
chai = require 'chai'
chai.use require 'sinon-chai'
should = chai.should()

TIMEOUT = 50
timeout = (to, fn) =>
    setTimeout fn, TIMEOUT*to

describe 'Cache', ->

    before ->
        @clock = sinon.useFakeTimers()

    after ->
        @clock.restore()

    it 'BasicCaching', ->
        cache = new Cache

        cache.setItem "foo", "bar"
        cache.getItem("foo").should.equal "bar"
        should.not.exist cache.getItem("missing")
        should.not.exist cache.removeItem("missing")
        stats = cache.getStats()
        stats.hits.should.equal 1
        stats.misses.should.equal 1
        cache.toHtmlString().should.equal "1 item(s) in cache<br /><ul><li>foo = bar</li></ul>"
        cache.size().should.equal 1

        cache.setItem "foo2", "bar2"
        cache.size().should.equal 2
        cache.removeItem("foo").should.equal "bar"
        cache.size().should.equal 1
        cache.clear()
        should.not.exist cache.getItem("foo")
        cache.size().should.equal 0

    it 'AbsoluteExpiration', (success) ->
        cache = new Cache
        cache.setItem "foo", "bar",
            expirationAbsolute: new Date(new Date().getTime() + TIMEOUT*2)
        cache.getItem("foo").should.equal "bar"

        timeout 1, ->
            cache.getItem("foo").should.equal "bar"

        timeout 3, ->
            should.not.exist cache.getItem("foo")
            success()

        @clock.tick TIMEOUT*3

    it 'SlidingExpiration', (success) ->
        cache = new Cache
        cache.setItem "foo", "bar",
            expirationSliding: TIMEOUT * 2 / 1000
        cache.getItem("foo").should.equal "bar"

        timeout 1, ->
            cache.getItem("foo").should.equal "bar"
            timeout 1, ->
                cache.getItem("foo").should.equal "bar"
                timeout 1, ->
                    cache.getItem("foo").should.equal "bar"
                    timeout 3, ->
                        should.not.exist cache.getItem("foo")
                        success()

        @clock.tick TIMEOUT*6

    it 'LRUExpiration', (success) ->
        cache = new Cache 2
        cache.setItem "foo1", "bar1"
        cache.setItem "foo2", "bar2"
        timeout 1, ->
            # Access an item so foo1 will be the LRU
            cache.getItem("foo2").should.equal "bar2"

            cache.setItem "foo3", "bar3"
            cache.size().should.equal 3

            # Allow time for cache to be purged
            timeout 1, ->
                should.not.exist cache.getItem("foo1")
                cache.getItem("foo2").should.equal "bar2"
                cache.getItem("foo3").should.equal "bar3"
                cache.size().should.equal 2
                success()

        @clock.tick TIMEOUT*2

    it 'PriorityExpiration', (success) ->
        cache = new Cache 2
        cache.setItem "foo1", "bar1",
            priority: Cache.Priority.HIGH

        cache.setItem "foo2", "bar2"
        timeout 1, ->
            # Access an item so foo1 will be the LRU
            cache.getItem("foo2").should.equal "bar2"

            timeout 1, ->
                cache.setItem "foo3", "bar3"
                cache.size().should.equal 3

                # Allow time for cache to be purged
                timeout 1, ->
                    cache.getItem("foo1").should.equal "bar1"
                    should.not.exist cache.getItem("foo2")
                    cache.getItem("foo3").should.equal "bar3"
                    cache.size().should.equal 2
                    success()

        @clock.tick TIMEOUT*3

    it 'Resize', (success) ->
        cache = new Cache
        cache.setItem "foo1", "bar1"
        timeout 1, ->
            cache.setItem "foo2", "bar2"
            timeout 1, ->
                cache.setItem "foo3", "bar3"
                cache.resize 2
                should.not.exist cache.getItem("foo1")
                cache.getItem("foo2").should.equal "bar2"
                timeout 1, ->
                    cache.getItem("foo3").should.equal "bar3"
                    cache.resize 1
                    should.not.exist cache.getItem("foo1")
                    should.not.exist cache.getItem("foo2")
                    cache.getItem("foo3").should.equal "bar3"
                    success()

        @clock.tick TIMEOUT*3

    it 'FillFactor', (success) ->
        cache = new Cache 100
        counter = 0
        cache.setItem "foo" + i, "bar" + i for i in [1..100]

        cache.size().should.equal 100
        timeout 1, ->
            cache.size().should.equal 100
            cache.setItem "purge", "do it"
            timeout 1, ->
                cache.size().should.equal 75
                success()

        @clock.tick TIMEOUT*2

    it 'OnPurge', ->
        cache = new Cache
        spy = sinon.spy()
        cache.setItem "foo", "bar",
            onPurge: spy
        cache.removeItem "foo"

        @clock.tick 1

        spy.should.have.been.calledWith "foo", "bar"

###

    it 'LocalStorageCache', (success) ->
        localStorage.clear()
        cache = new Cache 2, false, 'local_storage'
        cache.setItem "foo1", "bar1"
        cache.getItem("foo1").should.equal "bar1"
        should.not.exist cache.getItem("missing")
        stats = cache.getStats()
        stats.hits, 1
        stats.misses, 1
        cache.toHtmlString().should.equal "1 item(s) in cache<br /><ul><li>foo1 = bar1</li></ul>"
        cache.size().should.equal 1
        localStorage.length, 1

        timeout 1, ->
            cache.setItem "foo2", "bar2"
            cache.setItem "foo3", "bar3"
            timeout 1, ->
                cache.size().should.equal 2
                localStorage.length, 2

                cache.clear()
                should.not.exist cache.getItem("foo1")
                should.not.exist cache.getItem("foo2")
                should.not.exist cache.getItem("foo3")
                cache.size().should.equal 0
                localStorage.length, 0
                success()

    it 'LocalStorageExisting', (success) ->
        localStorage.clear()
        cache = new Cache(-1, false, 'local_storage'
        cache.setItem "foo", "bar"
        cache2 = new Cache -1, false, 'local_storage'
        cache.size().should.equal 1
        cache2.size().should.equal 1
        cache.removeItem "foo"
        cache.size().should.equal 0
        cache2.size().should.equal 0
        success()

    it 'LocalStorageCacheMaxSize', (success) ->
        localStorage.clear()
        cache = new Cache -1, false, 'local_storage'
        count = 0
        console.log 'Attempting to max out localStorage, this may take a while...'
        while true
            count += 1
            startSize = localStorage.length
            if  count % 500 == 0
                console.log '   added ' + count + ' items'

                cache.setItem "somelongerkeyhere" + count, Array(200).join("bar") + count
                if  localStorage.length - startSize < 0
                    console.log '   added ' + count + ' items'
                    localStorage.clear()
                    return success()

###
