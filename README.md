Synopsis:
ddoc-deploy [-p <path to package>]

Pushes design documents of a package to a target couchdb host

Options:
  -p, --package    path to package.json file to pull section ddocs from. The
                   ddocs section is expected in the root of the json file.
                                           [string]  [default: "./package.json"]
  -s, --src        (*)default source directory for design-documents, relative
                   to package.json. Cascades ddocs.src of package.json
                                                  [string]  [default: "_design"]
  -d, --dbs        (*)default list of databases to update on the target host.
                   Cascades ddocs.dbs from package.json                  [array]
  --push           (**)list source ddocs to push. Cascades section ddocs.push
                   in package.json                                       [array]
  -l, --log-level  log level - DEBUG|INFO|WARN|ERROR
                                                     [string]  [default: "INFO"]

(*) Switches of defaults are -s/--src/ddocs.src, -h/--hpst, -d/--dbs.
(**)When the 'push' section or the --push switch is an array of strings, then
    the list of ddocs to push is converted to a data-structure as following:
    push :
      { <ddoc1> : { src : <src dir1>, host: <host1>, dbs: <dbs1> }
      , <ddoc2> : { src : <src dir2>, host: <host2>, dbs: <dbs2> }
      }
    where <src dir>, <host> and <dbs> are taken from the defaults, using values
    found in 'ddocs' section of the package, or their cascading switches.
    Notes:
     - A project may define in package.json different src,host,dbs per ddoc
       by providing this structure directly.

     - Any missing attribute will still be taken from the defaults.
       When in the end of it an attribute is still missing because the original
       structure does not provide it AND no default provided - an error message
       will be put, and the process will exit with error

     - Elements in the structure can yet be overriden using switches using the
       dot syntax

       Example:
         $ ddocs-deploy ddoc1.host http://localhost:6666/ ddoc2.dbs db1,db2

       This will override the `host` for 'ddoc1' and the `dbs` list for 'ddoc2'
       The rest of the values are expected in section 'ddocs' of the package.json,
       in this case, the local one.

The tool is now limited in that it cannot be set to deploy in one execution the
same ddoc to multiple hosts. If you need it on multiple hosts, consider couchdb-
replication, or just run the tool fiew times with appropriate switches.

The tool will not push ddocs that are not a part of a package, even when
all values are provided by switches.
