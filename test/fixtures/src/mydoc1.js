module.exports = 
{ _id : "_design/blabla"
, shows: 
  { v : function() { 
      return  {
         headers:
         { "Content-Type"   : "text/javascript"
         }
       , body: 'SUCCESS'
       }
    }
  }
}