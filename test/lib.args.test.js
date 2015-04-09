var SUT   = require('../lib/args')
  , exit  = process.exit
  , error = console.error
  , code  = 0
  , msg   = []
  ;

module.exports = 
{ "lib/args" :
  { beforeAll: 
    function() {
        process.exit = function mockProcessExit(c) { code = c }
        console.error = function() { msg.push(arguments) }
    }
  , afterAll: 
    function() {
        process.exit = exit;
        console.error = error;
    }
  , "should be a module object, having the member: .of(..)" :
    function() {
        Should.exist(SUT);
        SUT.should.be.an.Object;
        SUT.should.have.property('of');
        SUT.of.should.be.a.Function;
    }
  , ".of(argv)" : 
    { "should be a synchronous function naimg one argument: argv" : 
      function() {
          SUT.of.should.be.a.Function;
          SUT.of.length.should.eql(1);
      }
    , "when used with anything that is not an array" : 
      { "should exit with a friendly error" :
        function() {
            var e;
            [ 123
            , true
            , null
            , undefined
            , {}
            , [{},true,"oh oh..."]
            ].forEach(function(oCase) {
                code = 0;
                msg  = [];
                SUT.of(oCase);
                code.should.not.eql(0, "did not exit for: " + oCase);
                msg.should.not.eql([]);
                msg[0][1].should.match(
                  /^illegal argv: argv is expected to be a string or an array of strings/i
                , "wrong message for case: " + oCase
                )
            })
        }
      }
    , "when used with a valid arguments array" : 
      { "should not fail" : 
        function() {
            SUT.of(["node","bin/ddocs-deploy","-p","./test/fixtures/package1.json"])
        } 
      }
    , "when run with no switches to cascade defaults and package.json does NOT contain ddocs section" : 
      { "should print an error and exit" :
        function() {
            
        }
      }
    , "when run with no switches to cascade defaults and package.json contains ddocs section" : 
      { "with defaults provided, and push as array of strings" : 
        null
      , "with no defaults and push in verbose style" :
        { "and all elements have all properties" : 
          null
        , "and one element or more miss properties" : 
          null
        }
      }
    , "when run with switches to cascade defaults" :
      { "with defaults provided, and push as array of strings" : 
        { "values from switches should cascade values in package" :
          null
        }
      , "with no defaults and push in verbose style" :
        { "and all elements have all properties" : 
          { "values in elements should cascade default switches" : 
            null
          }
        , "and one element or more miss properties" : 
          { "should print an error and exit" :
            null
          }
        }
      }
    , "when run with switches to cascade concrete attributes in ddocs structure" : 
      { "with defaults provided, and push as array of strigs" : 
        { "values in switches should cascade" : 
           null
        }
      , "with no defaults and push in verbose style"  :
        { "and all elements have all properties" : 
          { "values in switches should cascade" : 
            null
          }
        }
      }
    }
  }
}