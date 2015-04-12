var async     = require('async')
  , path      = require('path')
  //, COUCHAPP  = require('couchapp') -- waiting for :https://github.com/mikeal/node.couchapp.js/issues/104
  , COUCHAPP  = require('./couchapp/main')
  , LOG       = require('log4js').getLogger("lib/push")
  ;

//expose inner stages for testing, de-contextualized 
push.loadAttachments    = loadAttachments;
push.handleOnLoadedHook = handleOnLoadedHook;

module.exports = push;

LOG.debug("module loaded");

function push(args, done) {
    //input checks - raw level
    if (  !args
       || 'object' != typeof args
       || !Array.isArray(args.ddocs)
       || !args.ddocs.length
       ) {
        return done(new Error("options must be an object, and contain attribute 'ddocs' - array of ddocs commands to handle with at least one command"));
    }

    var ddocs    = args.ddocs
      //dependency injection for tests
      , log      = args.log || LOG
      , couchapp = args.couchapp || COUCHAPP
      ;

    //input checks - deeper
    if ( ( ddocs.errs = 
            ddocs.filter(function(cmd) { 
                return !cmd
                    || 'object' != typeof cmd
                    || !cmd.basedir
                    || !cmd.src
                    || !cmd.host
                    || !cmd.dbs && Array.isArray(cmd.dbs)
            }).map(function(cmd) { return cmd ? cmd.name : "N/A" } )
          ).length
        )
         return done(new Error("not all settings found. " + ddocs.errs ));

    log.info("will handle docs [%s]", Object.keys(ddocs) );

    async.serial( Object.keys(ddocs)
    , handleOneDoc
    , done
    )

    function handleOneDoc(name, done) {
        var cmd      = ddocs[name]
          , filepath = path.resolve( path.join( cmd.src , cmd.name ) )
          , app
          , err
          ;

        //TRICKY: hide password from log
        cmd.hostnocreds = cmd.host.replace(/(http|https):\/\/(.*)@.*:/, function(_,protocol,usr) { return protocol + "://" + usr + "@******" } );

        log.debug("[%s] - loading module from ", name, cmd.src);

        try {
            app = require( filepath );
        } catch (ex) {
            ex.package = args.package;
            ex.doc = name;
            ex.filepath = filepath;
            return done(ex)
        }
        
        //load attchments, or yield error
        if (err = loadAttachments(cmd)) return done(err);

        //run on loaded hook, or yield error
        if (err = handleOnLoadedHook(cmd)) return done(err);
        
        couchapp.createApp( app, function(app) {
              if (log.isInfoEnabled())
                  log.info("[%s] - will push to [%s] on ", name, cmd.dbs, cmd.hostnocreds);

              async.parallel( cmd.dbs
              , function(db, next) {
                    log.debug("[%s] - pushing to [%s] on ", name, db, cmd.hostnocreds);

                    app.push( path.join( cmd.host, db ), next )
                }
              )
          }
        , done
        )
    }

    function loadAttachments(cmd) {
        return push.loadAttachments(app, cmd, couchapp, log)
    }
    
    function handleOnLoadedHook(cmd) {
        return push.handleOnLoadedHook(app, cmd, couchapp, log)
    }
}

function validateCmd(cmd) {
}

function loadAttachments(app, cmd, couchapp, log) {
    if (!cmd.att) return;

    if ('string' == typeof (cmd.att) ) cmd.att = [cmd.att];

    if ('object' != cmd.att)
        return new Error("document attachments are expected to be an Array");

    if (!Array.isArray(cmd.att)) //convert { <path> : <prefix> }  to { path : <path> , prefix : <prefix> }
        cmd.att = 
          Object
            .keys( cmd.att )
            .reduce( function(att, path ) { 
                att.push( { root: path , prefix: cmd.att[path] } );
                return att
            }, [])

    cmd.att.forEach(function(item) {
        couchapp.loadAttachments( app, item.root, item.prefix )
    })
}

function handleOnLoadedHook(app, cmd, couchapp, log) { 
    if (!cmd.onloaded) return log.debug("[%s] - no onloaded hook found", cmd.name);

    var hookpath = path.resolve( path.join( cmd.basedir, cmd.onloaded ) )
      , hook
      , err
      ;
    log.debug("[%s] - handling onloaded hook", cmd.name);
    try {
        hook = require( hookpath );
        log.debug("[%s] - onloaded hook loaded", cmd.name);
        hook(app, cmd, couchapp)
    } catch (ex) {
        err = ex
    }
    if (!err) return log.info("[%s] - onloaded hook applied successfully");

    err.name     = cmd.name;
    err.onloaded = onLoad;
    err.hookpath = hookpath;
    return err;
}