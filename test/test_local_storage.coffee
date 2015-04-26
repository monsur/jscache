Cache = require '../'
LocalStorageCacheStorage = require '../lib/stores/local_storage'
sinon = require 'sinon'
chai = require 'chai'
chai.should()

describe 'LocalStorageCacheStorage', ->

  class MockLocalStorage
    Object.defineProperty @::, 'length', get: ->
      l = 0
      for own k of this
        l++
      l

    clear: ->
      for own key of this
        delete this[key]

  global.localStorage = new MockLocalStorage()

  before ->
    @clock = sinon.useFakeTimers()

  after ->
    @clock.restore()

  afterEach ->
    localStorage.clear()

  it 'stores items in localStorage', ->
    cache = new Cache(2, false, new LocalStorageCacheStorage())
    cache.setItem "foo1", "bar1"

    @clock.tick()
    cache.size().should.equal 1
    localStorage.length.should.equal 1

    cache.setItem "foo2", "bar2"
    cache.setItem "foo3", "bar3"

    @clock.tick()
    cache.size().should.equal 2
    localStorage.length.should.equal 2

    cache.clear()
    cache.size().should.equal 0
    localStorage.length.should.equal 0

  it 'shares items between caches with the same namespace', ->
    cache1 = new Cache(-1, false, new LocalStorageCacheStorage('a'))
    cache1.setItem "foo", "bar"
    cache2 = new Cache(-1, false, new LocalStorageCacheStorage('a'))
    cache1.size().should.equal 1
    cache2.size().should.equal 1
    localStorage.length.should.equal 1
    cache2.removeItem "foo"
    cache1.size().should.equal 0
    cache2.size().should.equal 0
    localStorage.length.should.equal 0

  it 'does not share items between caches with different namespace', ->
    cache1 = new Cache(-1, false, new LocalStorageCacheStorage('a'))
    cache1.setItem "foo", "bar"
    cache2 = new Cache(-1, false, new LocalStorageCacheStorage('b'))
    cache1.size().should.equal 1
    cache2.size().should.equal 0
    localStorage.length.should.equal 1
    cache2.setItem "foo", "bar"
    localStorage.length.should.equal 2
    cache1.removeItem "foo"
    cache1.size().should.equal 0
    cache2.size().should.equal 1
    localStorage.length.should.equal 1
