var log4js  = require('log4js')
  , args    = require('../lib/args').parse(process.argv)
  , push    = require('../lib/')
  , log     = log4js.getLogger("push")
  , log_lvl = args.l.toUpperCase()
  ;

//SET LOG FORMAT AND LEVEL
log4js.clearAppenders();
log4js.configure(
  { appenders: 
    [ { type   : "console"
      , layout : 
        { type   : "pattern"
        , pattern: "%[%r [%p]%]%n %m%n"
        }
      }
    ]
  }
);
log.setLevel('INFO|WARN|ERROR|FATAL'.split('|').indexOf(log_lvl) == -1 ? 'DEBUG' : log_lvl);

//announcements
log.info("starting push ddocs of ", args.package );
log.debug("full args\n", args);

//hook for exceptions
process.on('uncaughtException', function(err) {
    log.fatal("unhandled error:" , err);
    process.exit(1);
});

//fire!
push(args, function(err) {
    log[err?"error":"info"]("pushing ddocs complete with ", err || "success");
})