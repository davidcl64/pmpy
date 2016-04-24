#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

## PMPY: A push-me-pull-ya client for consul + (WIP) vault

PMPY makes it easier to manage key-value data in consul.  Currently get/set operations do not consider cas/ModifyIndex, etc.
It simply sets or retrieves values from Consul. Both JSON and env formats for input and output.  

Pushing data into Consul is as simple as:

```sh
$ pmpy consul push --path myapp --value='{"key1": "value1"}'
```

Pulling it back out again is just as easy:

```sh
$ pmpy consul pull --path myapp 
{
  "key1": "value1"
}
```

When pulling data out of Consul, PMPY allows you to specify multiple paths.  The resulting document is a merged document with 
values specified later overriding previous values.  This allows you to easily setup more complex documents to support
multiple environments/applications.

For example, given these three paths:

```sh
$ pmpy consul push --path myapp/defaults --value='{"host": "foo.bar"}'
$ pmpy consul push --path myapp/prod --value='{"database": "prod_db"}'
$ pmpy consul push --path myapp/dev --value='{"database": "dev_db"}'
```

You can retrieve data for a specific environment by specifying mutiple paths:
 
```sh
$ pmpy consul pull --path myapp/defaults --path myapp/prod
{
  "host": "foo.bar",
  "database": "prod_db"
}
$ pmpy consul pull --path myapp/defaults --path myapp/prod
{
  "host": "foo.bar",
  "database": "dev_db"
}
``` 


## Install

```sh
$ npm install --save pmpy
```


## Usage

```js
var consul = require('pmpy').consul;

// prefix is options - defaults to 'pmpy'
consul({ prefix: 'myorg' })
  .pull('myapp/beta')
  .subscribe(
    (conf) => console.log(JSON.stringify(conf),
    (err)  => console.log(err.stack)
  );
```

```sh
$ npm install -g pmpy
$ pmpy --help
```


## License

MIT © [David J. Clarke]()


[npm-image]: https://badge.fury.io/js/pmpy.svg
[npm-url]: https://npmjs.org/package/pmpy
[travis-image]: https://travis-ci.org/davidcl64/pmpy.svg?branch=master
[travis-url]: https://travis-ci.org/davidcl64/pmpy
[daviddm-image]: https://david-dm.org/davidcl64/pmpy.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/davidcl64/pmpy
