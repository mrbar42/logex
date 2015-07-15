# Logex

Logex is a js log module that use variables as base structure. it has instances support, coloring, and.
its kinda universal through browserify. minified version is available in dist directory.

Installation:
`npm install logex --save`


## Log instance

### Options

- utc - print all times in UTC
- format {string} log format (see variables). default: {LVL}:{CONTEXT}: {ID }{MSG}
- colors {boolean} weather to use terminal colors (automatically disabled in the browser and non colorish env's)
- level - {string} default log level. defaults: production:'info', development/debugging:'debug'
- name {string} name the instance (default: 'default')
- inlineVars {boolean} - search variables syntax everywhere

*note: all of the options are optional

```javascript
Log({/* options */})

var logger = Log('namedInstance', {/* options */})

```

Log levels (by priority):
1. none
2. error
3. warn
4. info
5. debug
6. verbose

## Examples

```javascript
var Log = require('logex'); // or window.Log in the browser

// change level on the default instance
 Log.level = "info";

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
    
    
    // instances
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

## methods

#### Level methods

all level methods have an  single letter alias (for android addicts)

 ```javascript
Log.error("I am an 'error' level message")
Log.warn("I am a 'warn' level message")
Log.log("I am an 'info' level message")
Log.info("I am an 'info' level message")
Log.debug("I am a 'debug' level message")
Log.verbose("I am a 'verbose' level message")

Log.d("I am a 'debug' level message")
```

#### Log level
default log level is:  production-info, development/debugging-debug

 ```javascript
Log.level = 'debug'
 // same as
Log({level: 'debug'})
```

#### Log format
default format is: `{LVL}:{CONTEXT}: {ID }{MSG}`

*note: `ID` variable will print nothing for the default instance

 ```javascript
Log({format: '{LVL}:{CONTEXT}: {ID }{MSG}'})

// named instances must provide their name when changing options
Log('myInstance', {format: '{LVL}:{CONTEXT}: {ID }{MSG}'})
// same as
Log({
  id: 'myInstance'
  format: '{LVL}:{CONTEXT}: {ID }{MSG}'
})
```

#### Log#print

special method to use a custom format directly.
if log level is not defined, the default one is used

`print([options|level], format, ..args)`

you can use the current format through `Log.options.format`

 ```javascript
 Log.print("{LVL_LOWER}: [{TIME}] {PT}/{PID} {MEM} i am %s!", "groot");
 
 Log.print('debug', "{LVL_LOWER}: [{TIME}] {PT}/{PID} {MEM}");
 
 // or define custom call specific options
 Log.print({level: 'debug'}, "[{LVL_ONE}] {HOUR} {CONTEXT} %s", "this is my message");
```

#### Log#userWarning
alias `Log.uw`

user warning is meant to inform the user he misused you function.
the context variable will point one call higher then itslef.

its a shortcut for
`Log.print({skip: 1}, Log.options.format, "your message", "and other args")`

exmaple.js
 ```javascript
   1  function sum(x ,y) {
   2      if (!x || !y) {
   3          Log.warn("invalid arguments. (I point myself)"); // CONTEXT is 'example.js:3:9'
   4          Log.userWarn("invalid arguments. (I point 1 invoker up the stack)"); // CONTEXT is 'example.js:10:1'
   5          return
   6      }
   7      return x + y;
   8  }
   9
   10 sum(1); // context
  
```

#### Log#patch

This will patch the console object with the selcted methods

`.patch(object, methodsArray)`

default methodsArray: `['error', 'warn', 'log', 'info', 'debug']`

```javascript
Log.patch(console)
console.log("i am actually a %s method", 'logex')
// will print: INFO:exmaple.js:1:1 i am actually a logex method

var obj = {}
// will patch only the given methods even if they don't originaly exist on the target object
Log.patch(obj, ['debug', 'verbose'])
obj.verbose("I am a logger too!")
```


#### Log#trace

This will print trace using the console or will print an error stack if trace method is not natively supported


#### Miscellaneous methods and props
 These are methods and properties that exist on the logger object but generally speaking there is no reason to use them at the moment
 ```javascript
Log.dateFormat([dateObject], "mask", {boolean} UTC) // returns formatted date string
Log.formats // predefined common formats (there arn't many... suggestions are welcome!)
Log.inspect(obj, options) // reference to 'util' module method
Log.format(...args) // reference to 'util' module method
Log.console // reference to the original console object
```
 


## Variables

### Syntax

Simple var `{NAME}`

Var with params `{NAME params 123}`

Closing var `{/NAME} | {/NAME params 123}`

Var with arguments `{NAME %} | {NAME params 123%}`

*note: never use '%' sign in parameter. use only to assign arguments.

### Available variables:

- `{LVL}` - Log level. example: INFO, WARN, ERROR etc
- `{LVL_LOWER}` - Log level in lower case. example: info, warn, error etc
- `{LVL_ONE}` - Log level in a single upper case letter. example: E, W, D etc
- `{CONTEXT 5}` - The location in which the log invoked. example: 'app.js:21:7'
- `{MSG}` - The log message
- `{PID}` - process.pid. example: 1725
- `{PT}` - process.title. example: node
- `{ENV}` - environment derived from process.env.NODE_ENV. example: 'development', 'production'' (feel free to override this or to write your own variable)
- `{ID}` - Identifier of the logger instance. the default is 'default'. Unlike any other var, it prints it paramters (not including the first space) to avoid redundant spaces when printing the var in the default logger

Date parameters:
- `{BUMP}` - time since last Bump (per instance). example: +1753ms
- `{BUMP anyName FLAG}` - named bump (namepsace is per instance) with flag. empty name = 'default'. 

  Flags:
  - START - reset start time to now and print 0ms
  - TOTAL - prints the total time from the first bump (or reset). exmaple: 7801ms, 35.4s
  - RESET - prints time diff from last bump and reset start time. exmaple: +2345ms
  - CLEAR - prints time diff from last bump and clear the namespace. this is good to avoid memory leaks
  - END - prints time diff from the last bump and clear the namespace
  - RESET_TOTAL - same as RESET but prints total time instaed
  - CLEAR_TOTAL - same is CLEAR but prints total time
  - END_TOTAL - same as END but prints total time
   
	see [Bump exmaple](#bump)

- `{STAMP}` - timestamp. example: 1420063200000
- `{HOUR}` - time in 24 hours. example: 16:45:41.178
- `{TIME}` - time in 24 hours. example: "16:45:41 GMT-0500 (EST)"
- `{UTC}` - time in 24 hours. example: Wed, 31 Dec 2015 16:45:41 GMT
- `{DATE}` - Default full date. example: 31/Dec/2015:16:45:41 -0500
- `{DATE formatString}` - custom Date. see [docs/DATE_FORMAT.md](https://github.com/mrbar42/logex/blob/master/docs/DATE_FORMAT.md). example: yyyy-mm-dd'T'HH:MM:ss -> 2015-12-31T16:45:41

Colors:
You can use any of the listed colors inside curly brackets
- BOLD, ITALIC, UNDERLINE, INVERSE, BLACK, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, WHITE, DEFAULT, GREY, LIGHT_GARY, LIGHT_RED, LIGHT_GREEN, LIGHT_YELLOW, LIGHT_BLUE, LIGHT_MAGENTA, LIGHT_CYAN
- special color: LVL - the current level color

Example: `{C LVL}[{LVL}]{/C} {C BLUE}my {C RED}red{/C} text{/C}`

Default 
`{PT}/{PID}{LVL}:[{HOUR}]:{CONTEXT}: {MSG}`

## Custom variables
- Custom variables can be either global (available to all instances), or instance specific
- variables name must be in UPPER case. _ and $ are allowed.
- Variable value is converted to string. function is invoked first.
- params should never contain the '%' sign as it reserved for argument assignment
- If you want to use the same function with several instances you can save data on Log.data {object} this object always starts empty.
- variable name is available on state.name
- synchronous!

##### Global declaration

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

##### Instance declaration:
```javascript
// Static
Log.STATUS = 'Listening';

// Dynamic
Log.STATUS = function (state, params, closing) {
    // this points the current instance
    return this.name + ':' + getDynamicStatus()
}
```

##### Passing arguments to custom Variables:
```javascript
  // define custom variable. 4th argument and up passed by the caller
  Log.variables.REQUEST = function (state, params, closing, extraArg1) {
        return extraArg1.method + ' ' + extraArg1.url;
    };
	
    // simulate request object
    var httpRequest = {
        url: '/home',
        method: 'GET'
    };

	// use % to pass 1 argument
    Log.print('debug', "[{LVL_ONE}] {REQUEST %}", httpRequest);
    // will print: [D] GET /home
 ```

<a name="bump" />
## Bump

```javascript
    Log.print("#1        total:{BUMP myTimer TOTAL}   diff: {BUMP}");
    setTimeout(function () {
        Log.print("#2        total:{BUMP myTimer TOTAL}   diff: {BUMP}");
    }, 1235);
    setTimeout(function () {
        Log.print("#3(reset) total:{BUMP myTimer RESET_TOTAL}   diff: {BUMP RESET}");
    }, 2435);

    setTimeout(function () {
        Log.print("#4        total:{BUMP myTimer TOTAL}   diff: {BUMP}    counted relative to last call");
    }, 3286);
    setTimeout(function () {
        Log.print("#5(clear) total:{BUMP myTimer CLEAR_TOTAL}   diff: {BUMP CLEAR}   clear the counter");
    }, 4386);
    setTimeout(function () {
        Log.print("#6        total:{BUMP myTimer TOTAL}   diff: {BUMP}     passively starts the timer again");
    }, 5286);
```
will print:
```
#1        total:0ms   diff: +0ms 
#2        total:1237ms   diff: +1237ms 
#3(reset) total:2438ms   diff: +1201ms 
#4        total:850ms   diff: +850ms    counted relative to last call 
#5(clear) total:1950ms   diff: +1100ms  clear the counter
#6        total:0ms   diff: +0ms     passively starts the timer again 
```
