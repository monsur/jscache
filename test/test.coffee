Cache = require '../'
sinon = require 'sinon'
chai = require 'chai'
chai.use require 'sinon-chai'
should = chai.should()

INTERVAL = 5
defer = (i, fn) =>
    setTimeout fn, INTERVAL*i

describe 'Cache', ->

    before ->
        @clock = sinon.useFakeTimers()

    after ->
        @clock.restore()

    describe 'basics', ->

        beforeEach ->
            @cache = new Cache

        it 'should set and get item', ->
            @cache.setItem "foo", "bar"
            @cache.getItem("foo").should.equal "bar"

        it 'should remove item', ->
            should.not.exist @cache.getItem("foo")
            @cache.setItem "foo", "bar"
            should.exist @cache.getItem("foo")
            should.exist @cache.removeItem("foo")
            should.not.exist @cache.getItem("foo")

        it 'should not get missing item', ->
            should.not.exist @cache.getItem("missing")

        it 'should not remove missing item', ->
            should.not.exist @cache.removeItem("missing")

        it 'should register stats', ->
            @cache.setItem "foo", "bar"
            @cache.getItem("foo")
            @cache.getItem("missing")
            @cache.removeItem("missing")
            stats = @cache.getStats()
            stats.hits.should.equal 1
            stats.misses.should.equal 1

        it 'should generate an HTML report', ->
            @cache.setItem "foo", "bar"
            @cache.toHtmlString().should.equal "1 item(s) in cache<br /><ul><li>foo = bar</li></ul>"

        it 'should register cache size', ->
            @cache.setItem "foo", "bar"
            @cache.size().should.equal 1

            @cache.setItem "foo2", "bar2"
            @cache.size().should.equal 2
            @cache.removeItem("foo")
            @cache.size().should.equal 1
            @cache.clear()
            should.not.exist @cache.getItem("foo")
            should.not.exist @cache.getItem("foo2")
            @cache.size().should.equal 0

    describe 'absolute expiration', ->

        beforeEach ->
            @cache = new Cache

            @cache.setItem "foo", "bar",
                expirationAbsolute: new Date(new Date().getTime() + INTERVAL*2)

            @cache.getItem("foo").should.equal "bar"

        it 'should expire', (done) ->

            defer 3, =>
                should.not.exist @cache.getItem("foo")
                done()

            @clock.tick INTERVAL*3

        it 'should not expire', ->

            defer 1, =>
                @cache.getItem("foo").should.equal "bar"

            @clock.tick INTERVAL*3

    describe 'sliding expiration', ->

        it 'should expire', (done) ->
            cache = new Cache

            cache.setItem "foo", "bar",
                expirationSliding: INTERVAL * 2 / 1000

            cache.getItem("foo").should.equal "bar"

            defer 1, ->
                cache.getItem("foo").should.equal "bar"
                defer 1, ->
                    cache.getItem("foo").should.equal "bar"
                    defer 1, ->
                        cache.getItem("foo").should.equal "bar"
                        defer 3, ->
                            should.not.exist cache.getItem("foo")
                            done()

            @clock.tick INTERVAL*6

    describe 'LRU expiration', ->

        it 'should expire', (done) ->
            cache = new Cache 2
            cache.setItem "foo1", "bar1"
            cache.setItem "foo2", "bar2"
            defer 1, ->
                # Access an item so foo1 will be the LRU
                cache.getItem("foo2").should.equal "bar2"

                cache.setItem "foo3", "bar3"
                cache.size().should.equal 3

                # Allow time for cache to be purged
                defer 1, ->
                    should.not.exist cache.getItem("foo1")
                    cache.getItem("foo2").should.equal "bar2"
                    cache.getItem("foo3").should.equal "bar3"
                    cache.size().should.equal 2
                    done()

            @clock.tick INTERVAL*2

    describe 'priority expiration', ->

        it 'should expire', (done) ->
            cache = new Cache 2
            cache.setItem "foo1", "bar1",
                priority: Cache.Priority.HIGH

            cache.setItem "foo2", "bar2"
            defer 1, ->
                # Access an item so foo1 will be the LRU
                cache.getItem("foo2").should.equal "bar2"

                defer 1, ->
                    cache.setItem "foo3", "bar3"
                    cache.size().should.equal 3

                    # Allow time for cache to be purged
                    defer 1, ->
                        cache.getItem("foo1").should.equal "bar1"
                        should.not.exist cache.getItem("foo2")
                        cache.getItem("foo3").should.equal "bar3"
                        cache.size().should.equal 2
                        done()

            @clock.tick INTERVAL*3

    describe 'sizing', ->

        it 'should resize', (done) ->
            cache = new Cache
            cache.setItem "foo1", "bar1"
            defer 1, ->
                cache.setItem "foo2", "bar2"
                defer 1, ->
                    cache.setItem "foo3", "bar3"
                    cache.resize 2
                    should.not.exist cache.getItem("foo1")
                    cache.getItem("foo2").should.equal "bar2"
                    defer 1, ->
                        cache.getItem("foo3").should.equal "bar3"
                        cache.resize 1
                        should.not.exist cache.getItem("foo1")
                        should.not.exist cache.getItem("foo2")
                        cache.getItem("foo3").should.equal "bar3"
                        done()

            @clock.tick INTERVAL*3

        it 'should use a fill factor', (done) ->
            cache = new Cache 100
            counter = 0
            cache.setItem "foo" + i, "bar" + i for i in [1..100]

            cache.size().should.equal 100
            defer 1, ->
                cache.size().should.equal 100
                cache.setItem "purge", "do it"
                defer 1, ->
                    cache.size().should.equal 75
                    done()

            @clock.tick INTERVAL*2

    it 'should callback on purge', ->
        cache = new Cache
        spy = sinon.spy()
        cache.setItem "foo", "bar",
            onPurge: spy
        cache.removeItem "foo"

        @clock.tick 1

        spy.should.have.been.calledWith "foo", "bar"

