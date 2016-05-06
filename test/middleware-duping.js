var codemap = require('../')
var assert = require('assert')

describe('middleware duping', function () {
  it('does not dupe', function (done) {
    var core = [
      {
        _ns: 'motley',
        _folder: 'hooks',

        'listen[]': function container (get) {
          return function listen (cb) {
            get('hooks.server')
            cb()
          }
        },
        'server': function container (get, set) {
          set('123', 'lol')
          return null
        }
      },
      {
        _ns: 'motley',

        'middleware[-60]': [],
        'middleware[-40]': [],
        'middleware[-30]': [],
        'middleware[-10]': [],
        'middleware[10]': [],
        'middleware[0]': [],
        'middleware[]': []
      }
    ]

    function motley () {
      var rootMap = {
        _maps: core.concat([].slice.call(arguments)),
        'listen': function container (get, set) {
          return function runListen (cb) {
            require('run-series')(get('motley:hooks.listen'), function (err) {
              if (err) return cb(err)
              set('foo', 'bar')
              cb()
            })
          }
        },

        'get': function container (get, set) {
          return get
        },
        'set': function container (get, set) {
          return set
        }
      }
      return codemap(rootMap).export()
    }

    var app = motley({
      _ns: 'motley',
      _maps: [
        {
          _ns: 'motley',
          'middleware[]': []
        },
        {
          _ns: 'motley',
          'middleware[]': []
        },
        {
          _ns: 'motley',
          'middleware[-60]': ['buffet']
        },
        {
          _ns: 'motley',
          'middleware.templ': function container (get, set) {
            set('bar', 'baz')
            return 'templ'
          },
          'middleware[-60]': ['#middleware.templ', 'foo']
        }
      ]
    })

    app.listen(function (err) {
      if (err) return done(err)
      assert.deepEqual(app.get('motley:middleware'), ['buffet', 'templ', 'foo'])
      done()
    })
  })
})