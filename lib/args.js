var fs    = require('fs')
  , o     = require('o-core')
  , path  = require('path')
  , yargs = 
    require('yargs')
     .usage(
       [ "Synopsis: " 
       , "    ddoc-deploy [-p <path to package>]"
       , ""
       , "Pushes design documents of a package to a target couchdb host"
       ].join("\n")
     , { p : 
         { alias    : 'package'
         , describe : 'path to package.json file to pull section ddocs from. The ddocs section is expected in the root of the json file.'
         , default  : './package.json'
         , type     : 'string'
         }
       , s :
         { alias    : 'src'
         , describe : '(*)default source directory for design-documents, relative to package.json. Cascades ddocs.src of package.json'
         , default  : '_design'
         , type     : 'string'
         }
       , h : 
         { alias    : 'host'
         , describe : '(*)default couchdb target host to update. Cascades ddocs.host of package.json'
         , type     : 'string'
         }
       , d : 
         { alias    : 'dbs'
         , describe : '(*)default list of databases to update on the target host. Cascades ddocs.dbs from package.json'
         , type     : 'array'
         }
       , push: 
         { type     : 'array'
         , describe : '(**)list source ddocs to push. Cascades section ddocs.push in package.json'
         , implies  : ['h','d']
         }
       , h : 
         { alias    : 'help'
         , desceibe : 'displays a full help message'
         , type     : 'boolean'
         }
       , l : 
         { alias    : 'log-level'
         , describe : 'log level - DEBUG|INFO|WARN|ERROR'
         , default  : 'INFO'
         , type     : 'string'
         }
       }
     )
  , epilog = 
     [ "(*) Switches of defaults are -s/--src/ddocs.src, -h/--hpst, -d/--dbs."
     , "(**)When the 'push' section or the --push switch is an array of strings, then"
     , "    the list of ddocs to push is converted to a data-structure as following:"
     , "    push : "
     , "      { <ddoc1> : { src : <src dir1>, host: <host1>, dbs: <dbs1> }"
     , "      , <ddoc2> : { src : <src dir2>, host: <host2>, dbs: <dbs2> }"
     , "      }"
     , "    where <src dir>, <host> and <dbs> are taken from the defaults, using values"
     , "    found in 'ddocs' section of the package, or their cascading switches."
     , "    Notes:"
     , "     - A project may define in package.json different src,host,dbs per ddoc"
     , "       by providing this structure directly."
     , ""
     , "     - Any missing attribute will still be taken from the defaults."
     , "       When in the end of it an attribute is still missing because the original"
     , "       structure does not provide it AND no default provided - an error message"
     , "       will be put, and the process will exit with error"
     , ""
     , "     - Elements in the structure can yet be overriden using switches using the"
     , "       dot syntax"
     , ""
     , "       Example: "
     , "         $ ddocs-deploy ddoc1.host http://localhost:6666/ ddoc2.dbs db1,db2"
     , ""
     , "       This will override the `host` for 'ddoc1' and the `dbs` list for 'ddoc2'"
     , "       The rest of the values are expected in section 'ddocs' of the package.json,"
     , "       in this case, the local one."
     , ""
     , "The tool is now limited in that it cannot be set to deploy in one execution the" 
     , "same ddoc to multiple hosts. If you need it on multiple hosts, consider couchdb-"
     , "replication, or just run the tool fiew times with appropriate switches."
     , ""
     , "The tool will not push ddocs that are not a part of a package, even when"
     , "all values are provided by switches."
     ].join("\r\n")
 ;

module.exports = 
  { of: args_parse
  }

function args_parse(argv) {
    var args 
      , pkg
      , defautls
      , sPackagePath
      ;

    try {
        args = yargs.parse(argv)
    } catch (ex) {
       return reject("illegal argv: argv is expected to be a string or an array of strings. provided: " + JSON.stringify( argv ) );
    }

    if (args.help) {
        console.log(yargs.help());
        console.log(epilog);
        return process.exit();
    }

    sPackagePath = path.resolve(args.package);

    try {
        pkg = require(sPackagePath)
    } catch (ex) {
        return reject("could not find source package. looking in: " + args.package)
    }
    args.basedir = path.dirname( sPackagePath );

    if (pkg.ddocs) 
        args = o.merge(pkg.ddocs, args);

    if (!args.push) 
        return reject("no source design-documents specified");
    
    defaults = 
      { src  : args.src
      , host : args.host
      , dbs  : args.dbs
      }
    ;

    if (Array.isArray( args.push ) )
        args.push = 
          args.push.reduce(function(push, ddoc) {
              push[ddoc] = o.extend( { name: ddoc}, defaults);
              return push;
          }, {});
    else
        Object.keys( args.push ).forEach( function(ddoc) {
            var options = args.push[ddoc]
              ;
            o.defaults( options, defaults );
            options.name = ddoc;

            if (!options.host) 
                return reject("target host for design-document " + ddoc + " is not provided, and no default host provided");
            if (!options.dbs ) 
                return reject("target dbs for design-document " + ddoc + " is not provided, and no default dbs provided");
        });
    
    return args;

    function reject(msg) {
        console.error("%s\n use --help for full help", msg);
        process.exit(1);
    }
}