# Logex

Logex is a js log module that use variables as base structure. it has instances support, coloring, and.
its kinda universal through browserify. minified version is available in dist directory.

Installation:
`npm install logex --save`


## Log instance

### Options

- utc - print all times in UTC
- format {string} log format (see variables). default: {LVL}:{CONTEXT}: {MSG}
- colors {boolean} weather to use terminal colors (automatically disabled in the browser and non colorish env's)
- level - {string} default log level. defaults: production:'info', development/debugging:'debug'
- name {string} name the instance (default: 'default')
- inlineVars {boolean} - search variables syntax everywhere

*note: all of the options are optional

Log levels:
- none
- error
- warning
- info
- debug
- verbose

## Examples

```javascript
var Log = require('logex'); // or window.Log in the browser

// change level on the default instance
 Log.level = "asdasd";

 Log.debug('i will not appear');

 // changing log level via option declaration
 Log({level: 'verbose'});
 
 Log.debug("I am %s off", 'showing');
 
  // patch an object to be a logex instance
 Log.patch(console);
 console.log("Work is %s!", 'Done', {a:1}, false, null, 1, function tester(){});

  // print method bypasses the default format and allow to dynamically declare one
  // each % sign will pass one argument to the variable handler
  Log.print('info', "{C LVL}[{LVL}]{/C} {C GREEN}my {C RED}red{/C} text{/C}");
   

    function sum(x ,y) {
        if (!x || !y) {
            Log.userWarn("invalid arguments. (I point 1 invoker up the stack) and not on myself");
            return
        }

        return x + y;
    }

    sum(1);
    
    
    // instances and variables
    var firstInstance = Log("first instance");
    var secondInstance = Log("Second instance");

	// global declaration
    firstInstance.variables.TEST = 123;
    firstInstance.variables.STATUS = 'GLOBAL';
    
    // instance specific declaration
    firstInstance.STATUS = 'firstInstance';
    secondInstance.STATUS = 'secondInstance';


    firstInstance.print("{ID  }{STATUS} {TEST}");
    secondInstance.print("{ID  }{STATUS} {TEST}");
    Log.print("{ID  }{STATUS} {TEST}");

```

## Variables

Available parameters:
- `{ID}` - Identifier of the logger instance. the default is 'default' and it will print empty var. id will also print its parameters to avoid redundant spaces and chars 
- `{LVL}` - Log level. example: INFO, WARN, ERROR etc
- `{LVL_LOWER}` - Log level in lower case. example: info, warn, error etc
- `{LVL_ONE}` - Log level in a single upper case letter. example: E, W, D etc
- `{CONTEXT 5}` - The location in which the log invoked. example: 'app.js:21:7'
- `{MSG}` - The log message
- `{PID}` - process.pid. example: 1725
- `{PT}` - process.title. example: node
- `{ENV}` - environment derived from process.env.NODE_ENV. example: 'development', 'production'' (feel free to override this or to write your own variable)

Date parameters:
- `{BUMP}` - time since last Bump (per instance). example: +1753
- `{BUMP anyName RESET|DELETE|END}` - named bump (per instance). accepts name and optional action flag (RESET|DELETE). the default name is 'default'. example: +1753
- `{STAMP}` - timestamp. example: 1420063200000
- `{HOUR}` - time in 24 hours. example: 16:45:41.178
- `{TIME}` - time in 24 hours. example: "16:45:41 GMT-0500 (EST)"
- `{UTC}` - time in 24 hours. example: Wed, 31 Dec 2015 16:45:41 GMT
- `{DATE}` - Default full date. example: 31/Dec/2015:16:45:41 -0500
- `{DATE formatString}` - custom Date. see docs/DATE_FORMAT.md. example: yyyy-mm-dd'T'HH:MM:ss -> 2015-12-31T16:45:41

Colors:
You can use any of the listed colors inside curly brackets
- BOLD, ITALIC, UNDERLINE, INVERSE, BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE, DEFAULT, GREY, LIGHT_GARY, LIGHT_RED, LIGHT_GREEN, LIGHT_YELLOW, LIGHT_BLUE, LIGHT_MAGENTA, LIGHT_CYAN
- special color: LVL - the current level color

Example: `{C LVL}[{LVL}]{/C} {C BLUE}my {C RED}red{/C} text{/C}`

Default
`{PT}/{PID}{LVL}:[{HOUR}]:{CONTEXT}: {MSG}`

Custom variable:
- Custom variables can be either global (available to all instances), or instance specific
- variables name must be in UPPER case. _ and $ are allowed.
- Variable value is converted to string or invoked if a function is provided.
- If you want to use the same function with several instances you can save data on `instance.data` (Object). this object always starts empty.

#### Global declaration:
```javascript
// Static
Log.variables.STATUS = 'Listening';

var obj = {status: 'Listening'}
// object reference - practically dynamic
Log.variables.STATUS = obj;

// function
Log.variables.STATUS = function (state, params, closing) {
    // this points the current instance (the one that used the variable);
    this.data.myData = 'per instance safe space to store data';
    return this.name + ':' + getDynamicStatus()
}
```

#### Instance declaration:
```javascript
// Static
Log.STATUS = 'Listening';

// Dynamic
Log.STATUS = function (state, params, closing) {
    // this points the current instance
    return this.name + ':' + getDynamicStatus()
}
```

#### Passing arguments to custom Variables:
```javascript
// define custom variable. 4th argument and up are given by the caller
  Log.variables.REQUEST = function (state, params, closing, extraArg1) {
        return extraArg1.method + ' ' + extraArg1.url;
    };
	
    // simulate request object
    var httpRequest = {
        url: '/home',
        method: 'GET'
    };

	// use variable and pass 1 argument
    Log.print('debug', "{C LVL}[{LVL_ONE}]{/C} [{TIME}] {REQUEST %}", httpRequest);
    // will print: [D] [14:25:12 GMT-0500 (EST)] GET /home
```