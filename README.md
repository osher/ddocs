ddocs-deployer
==============

The goal of the utility is to hanlde in simple CLI tool meant for DevOps & CI flows the hanlding of all design-documents expressed in a package:
 * hiding all the low-level details of pushing each a couchapp to it's target db or dbs.
 * using all reatative values in JSON config file (that could just as well be the package.json itself)
 * keeping the tool versatile, letting Developers & DevOps override by CLI switches any value they need

There are two usages for this lib: 
* manual deployement - run as CLI tool
* automated deployement as part of CI process

About the context in which the tool runs
-----------------------------------------
* The tool is meant to be installed on the deploying machine as *global package (using -g)*, however can run locally to a given workfolder.
* The tool should be run from a machine that has the package on disk (after installing it from npm, retrieving it from scm, or downloading the archive).
* The tool should be run from a machine that can access all target couchdb hosts
* If the target host & dbs require authentication - the creds should be passed as part of the couchdb url

Manual run as CLI tool
--------------------------------------------------------
This scenario is meant for any target host who is NOT part of a CI flow, i.e - autometed deployement upon human decision.

In this case, the tool should be used as a CLI tool in a context as described above.


Using a prepublish hook
-------------------------------------------------------------
This scenario is meant for any target host that is updated as part of a CI flow, i.e - from within a builder.

Since the target of the design-documents is a couchdb host, and not an npm-registry, we can use an npm-hook for that.

The recommended hook is `prepublish`:

```
  "scripts" : {
    "prepublish" : "ddocs-deploy"
  },
```

In case you have a build-plan per environment you can use a build-time env-variable to pass build-plan specific witches.

For this, you'll have to set your `package.json` as following:

```
  "scripts" : {
    "prepublish" : "ddocs-deploy $OPTIONS"
  },
```

Then, set a build-time env variable (we use Jenkins, but all modern builders have a solution for it ).

**Example**
Asume the package has one design-document called `myddoc`, and the app is tested 
on 3 environments, for each there's a different database, and the production db 
runs on a different host, then, you can use the `package.json` to list the docs
and the host of the 2 first envs, and set a build plan per env as following, where
each env has it's own OPTIONS set in the build-plan configuration:

|env build plan| value for OPTIONS | 
| dev   | `--myddoc1.dbs mydb_dev` |
| stage | `--myddoc1.dbs mydb_stg` |
| prod  | `--myddoc1.dbs mydb_prod --host http://admin@shhh!!!:couchdb-prod.myapp.com` |


Help
----

```
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
```