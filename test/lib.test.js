var SUT = require('../')

module.exports = 
{ "ddoc/lib" : 
  { "should be a strategy function that names 2 arguments - args, callback " : 
    function() {
        Should.exist(SUT);
        SUT.should.be.a.Function;
        SUT.length.should.eql(2)
    }
  , "when used with invalid arguments" : 
    { "should yield an error" : 
      function(done) {
          var cases
            , count = 0
            ;
          cases = 
            [ null
            , "str"
            , 3223
            , true
            , false
            , function() {}
            , {}
            , { ddocs : null }
            , { ddocs : true }
            , { ddocs : "Str" }
            , { ddocs : 123 }
            , { ddocs : [ null ] }
            , { ddocs : [ true ] } 
            , { ddocs : [ 'str' ] }
            , { ddocs : [ 456 ] }
            , { ddocs : 
                [ {}
                ] 
              }
            , { ddocs : 
                [ { name   : "myddoc1"
                  , baseidr: "./test/fixtures/"
                  , src    : "_desing"
                  , host   : "http://localhost:5984/"
                  , dbs    : [ "bla" ]
                  }
                , { name   : "myddoc2"
                  }
                ] 
              }
            ]
          cases.forEach(function(args, ix) {
              SUT(args, function(err) {
                  Should.exist(err, "no error for case: " + ix);

                  if (++count == cases.length)  done()
              })
          })
      }
    }
  }
}