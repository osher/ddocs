var SUT = require('../')

module.exports = 
{ "ddoc/lib" : 
  { "should be a strategy function that names 2 arguments - args, callback " : 
    function() {
        Should.exist(SUT);
        SUT.should.be.a.Function;
        SUT.length.should.eql(2)
    }
  , "when used with valid arguments" : 
    {
    }
  }
}