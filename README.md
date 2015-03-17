Pushes design documents of a component to a target couchdb host

```
Options:
  -c, --component    Path to component.json                                         [required]
  -e, --environment  environment specifier, used to compose env-dependent db names  [required]
  -h, --host         target couchdb host to update                                  [required]
  -w, --worlds       list of worlds
  -l, --logLevel     log level - DEBUG|INFO|WARN|ERROR|FATAL                        [default: "INFO"]
```

Usage:
```
node index.js -c <path to component.json> \
              -e <env> \
              -h <url to with host and port, no DB names> \
              [-w "<list of worlds>"] \
              [-l <log leve>]
```

Example:

```
node index.js -c D:\ws\osg-web-comm\reports-db\ddocs.json -e lat -h http://uaadmin:uaadmin@couch.db:5984/ -w "0 1 100 113 2"
```