ddocs-deployer [![Build Status](https://secure.travis-ci.org/osher/ddocs.png?branch=master)](http://travis-ci.org/osher/ddocs)
==============

Hanlde in simple CLI command all design-documents expressed in a package. The 
tool is meant for DevOps & CI flows.
 * hiding all the low-level details of pushing each couchapp in the pacakge to 
   it's target db or dbs
 * allows to keep all repeatative values in a JSON config file (that could just
   as well be the package.json itself)
 * keeping the tool versatile, letting Developers & DevOps override any value 
   they need by CLI switches 

usages
------
There are two usages for this lib: 
* manual deployement - just run the CLI tool
* automated deployement - run the CLI tool as part of CI process

Both ways require the context in wich the tool runs to be prepared.

About the context in which the tool runs
-----------------------------------------
* The tool is meant to be installed on the deploying machine as *global package 
  (using -g)*, however can run locally to a given workfolder
* The tool should be run from a machine that has the source package that 
  contains the design-documents on disk (after installing it from npm, 
  or retrieving it from scm, or downloading the archive and extracting it)
* The tool should be run from a machine that can access all target couchdb hosts
  involved in the process
* If the target host & dbs require authentication - the creds should be passed 
  as part of the couchdb url

Manual run as CLI tool
----------------------
This scenario is meant for any target host who is NOT part of a CI flow, i.e - 
autometed deployement upon human decision.

In this case, the tool should be used as a CLI tool in a context as described 
above.


As part of CI flow - use the postpublish hook
--------------------------------------------
This scenario is meant for any target host that is updated as part of a CI flow,
i.e - from within a builder host by a builder script/action.

The builder-agent machine in this case (where the build occurs), should be set 
up as the context in which the tool runs.

Build of normal packages end up with npm-publish, resulting with the code of the
package wrapped and shipped to an NPM registry. However, since the target of the 
design-documents is a couchdb host, and not an npm-registry, we can use an npm-
hook for that, and publish the package normally.

Recommended hook is `postpublish`, because the publish of a design-document is
actually uploading it to the couchdb, where `postpublish` is not called when a
developer calls `npm install`, and is called *after* `test` hook is run, where 
unit-tests naturally run. However, can use any npm hook according to your flow,
for example, if the unit-tests expect the ddocs to be tested in the db.

```
  "scripts" : {
    "postpublish" : "ddocs-deploy"
  },
```

(*) if the tool is not installed globally, you can register it as a dependency in 
`pacakge.json` (at least as --dev-dependency), so it will be accessible on the 
project's folder for example - on the build-agent).

Advanced CI flows 
-----------------

In case you have many environments, and you have a build-plan per environment you 
can use a build-time env-variable to pass build-plan specific witches.

For this, you'll have to set your `package.json` as following:

```
  "scripts" : {
    "postpublish" : "ddocs-deploy $OPTIONS"
  },
```

Then, set a build-time env variable (we use Jenkins, but all modern builders 
have a solution for it).

**Example**
Asume the package has one design-document called `myddoc`, and the app is tested 
on 3 environments, for each there's a different database, and the production db 
runs on a different host. 

Assume a the following `ddocs` section in your `package.json`, that lists the 
design-documents in the pacakge (in section `ddocs.push`), and the default host
as the development couchdb host (in section `ddocs.host`):

```
  "ddocs" {
    "push" : [
      "myddoc1",
      "myddoc2"
    ],
    "host" : "http://couch-dev.myapp.com"
  }, 
  "scripts" : {
    "prepublish" : "ddocs-deploy $OPTIONS"
  },
```

Note that the `dbs` section is not given in the `package.json`, assuring that 
running the tool without being specific (without parameters, relaying just on
defaults) will not result in deploying the docs to a database unintentionally.

That being cascaded with per env-build-plan switches, where each env has it's 
own cascading switches on `$OPTIONS` set in the build-plan configuration:

| env build plan | value for `$OPTIONS` | 
| -------------- | ----------------- |
| dev   | `--dbs mydb_dev` |
| stage | `--dbs mydb_stg` |
| prod  | `--dbs mydb_prod --host http://admin@shhh!!!:couchdb-prod.myapp.com` |

The way the switches work is explained in more detail in the ***help*** section, which is 
also spat out whenever the tool is run with the `--help` switch.

Help
----

The help is also available when running the tool with the `--help` switch.

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
    { <ddoc1> : { src : <srcdir1>, host: <host1>, dbs: <dbs1>, basedir: <ddir> }
    , <ddoc2> : { src : <srcdir2>, host: <host2>, dbs: <dbs2>, basedir: <ddir> }
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

Isntallation
------------

Meant to be installed once as a CLI tool on the deployer's host:
```
npm install ddocs -g
```

Can be installed as package dependency, in this case, the command will be visible from the projects folder

```
npm install ddocs --save-dev
```

Contribution
------------
* Through PRs :)
* make sure tests pass
* if you add funcitonality - do try to add tests :)


Lisence
-------
MIT, and that's it :)

Have fun