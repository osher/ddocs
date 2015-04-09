var log4js    = require('log4js')
  , exec      = require('child_process').exec
  , async     = require('async')
  , errs      = require('errs')
  , path      = require('path')
  , couchapp  = require('couchapp')
  , LOG       = log4js.getLogger("lib/push")
  ;

function push(args, done) {
    var ddocs = args.ddocs
      , log   = args.log || LOG
      ;
    async.serial( Object.keys(ddocs)
    , pushOneDoc
    , done
    )

    function pushOneDocToDBs(name, done) {
        var cfg = docs[name]
          ;

        async.parallel( cfg.dbs
        , function(db, next) {
                        
          }
        , done
        )
    }

    function pushOneDocToOneDB(host, db, doc, done) {
    }
}






// -- find base dir
baseDir = path.dirname(path.resolve(args.c));
log.isDebugEnabled
  ? log.debug("loaded %s from %s, \n  config: %j", args.c, baseDir, cfg)
  : log.info ("loaded %s from %s"                , args.c, baseDir     )
  ;


if (!cfg.couchapp){ 
    log.error("couchapp section is not found in %s", cfg);
    return process.exit(1);
}

//PROCESS DOCS IN TARGET SETTING
/*
  abstraction of the normal flow
  
  >>forEach ddoc in config
    + <anonym> iteration handler 
    |   + handleDocument(doc,dbs,next)
    |       + >>foreach db-pattern in dbs
    |           + <anonym> iteration handler
    |           |   + executeCommands(cmds, dir, next)
    |           |        + >>foreach cmd in cmds
    |           |            + <anonym> iteration handler
    |           |            |    + exec(cmd, cfg
    |           |            |        + <anonym> callback
    |           |            + next
    |           |
    |           + <anonym> final result handler
    |
    + <anonym> final result handler

*/

function push(cfg, done) {

    async.forEach( Object.keys( cfg.couchapp ), 
      // every ddoc is processed with:
      function(ddocPath, next){ 
          log.debug("handling document: %s, for DBs [%s]", ddocPath, cfg.couchapp[ddocPath] );
          handleDocument(ddocPath, cfg.couchapp[ddocPath], next);
      }
    , // final result hanlder:
      done
    )
}


/**
 @param {string} ddocPath - relative to component.json
 @param {object} cfg
 @param {string[optional]} cfg.db - string db-name or array of strubg db-names, supporting only @ENV placeholder
 @param {string[optional]} cfg.world_db - string db-name pattern or array of strubg db-name-patterns, supporting 
    placeholders @ENV and @WORLD.
 */
function handleDocument(ddocPath, dbs, next) {
    if ('function' != typeof next) next = function(){}
    if ('string' == typeof dbs   ) dbs = [dbs];
    if ('string' == typeof worlds) worlds = [worlds];
    
    if (dbs.length == 0) {
        log.warn("did not find any targets for %s\n\t%j", ddocPath, cfg);
        return;
    }
    
    var dir = path.dirname(ddocPath)
      , doc = path.basename(ddocPath)
      ;
    log.debug("dir : %s, app file: %s",dir , doc);
    if (!doc.match(/\.js$/)) doc += ".js";

    async.forEach( dbs, 
      //every db is processed with 
      function(name, next){ 
          log.debug("hadnling target: %s", name);
          var dbUrl = args.h + name.replace(/@ENV/,ENV)
            , cmd    = ["couchapp push",doc,dbUrl].join(" ")
            , w = args.w 
            ;
          
          if (cmd.match(/@WORLD/)){ 
              if (!w) 
                  return next(errs.create( 
                    { message: "target contains @WORLD specifier, but no world was provided"
                    , dbUrl: dbUrl
                    }
                  ));
              log.debug("w is <%s>", w);
              if ('string' == typeof w)
                  w = w.split(/[,\s]/g);

              cmd = w.map(function(w){ 
                  return cmd.replace(/@WORLD/g, w);
              })
          } else
              cmd = [ cmd ];

          log.debug("target [%s] resulted witn [%s] command(s)\n\n", name, cmd.length, cmd);
          executeCommands(cmd, dir, next);
      }
    , //final result hanlder
      function(err){ 
          if (err) { 
              return next(errs.merge(err, { message: err.message, dbs: dbs, ddoc: doc } ));
          }

          log.info("handled well \n\t%s", ddocPath);
          next();
      }
    );
}


 
/**
 @param {Array} cmds - array of string shell commands
 @param {function} next(err) - callback
 */
function  executeCommands(cmds, subdir, next){
    async.forEach( cmds, 
      function(cmd, next){
          log.debug("running ", cmd);
          exec(cmd, { cwd: path.join(baseDir,subdir) }, 
            function(err, stdout, stderr) { 
                log.debug("returned %s \n\tfrom %s", err || "OK",cmd);
                var s = (stderr + "").split(/\s*\r?\n/g);
                cmd = cmd.replace("couchapp push ","").replace(/:[^\/@]+@/,":****@").split(" ");
                if (err) 
                    return next( 
                      { message: "error on running shell command"
                      , path: path.join(baseDir,subdir)
                      , db: cmd[1]
                      , stack: "\n  " + s.slice(4,6).join("\n  ") 
                      }
                    );
                log.info("pushed successfully: \n\t%s/_design/%s",cmd[1], cmd[0] );
                next();
            }
          )
      }
    , next
    )
}