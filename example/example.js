'use strict';

(function (Log) {


    Log.level = "asdasd";

    Log.debug('i will not appear');

    Log({level: 'verbose'});
    Log.debug("I am %s off", 'showing');

    Log.variables.REQUEST = function (state, params, closing, req) {
        return req.method + ' ' + req.url;
    };

    var req = {
        url: '/home',
        method: 'GET',
        query: {page: 'home'}
    };

    Log.print('debug', "{C LVL}[{LVL_ONE}]{/C} [{TIME}] {REQUEST %}", req);



    Log({inlineVars: true});

    Log.patch(console);
    console.log("Work is %s!", 'Done', {a:1}, false, null, 1, function tester(){});


    console.debug('{REQUEST %}', req);
    Log.print('debug', "{C YYY}[{LVL_ONE}]{/C} {REQUEST %}", req);
    Log.print('info', "{C LVL}[{LVL}]{/C} {C GREEN}my {C RED}red{/C} text{/C}");


    function sum(x ,y) {
        if (!x || !y) {
            Log.userWarn("invalid arguments. (I point 1 invoker up the stack)");
            return
        }

        return x + y;
    }

    sum(1);

    var firstInstance = Log("first instance");
    var secondInstance = Log("Second instance");

    firstInstance.variables.TEST = 123;
    firstInstance.variables.STATUS = 'GLOBAL';
    firstInstance.STATUS = 'firstInstance';
    secondInstance.STATUS = 'secondInstance';


    firstInstance.print("{ID  }{STATUS} {TEST}");
    secondInstance.print("{ID  }{STATUS} {TEST}");
    Log.print("{ID  }{STATUS} {TEST}");


    /*

     object obj  {
     string(36) 'myString'
     number 21684
     regex  /sdsdsd/g
     null  null
     function MyFunction()
     Array(10) [
     string(35) ''
     object {
     string
     }
     ]
     object {

     }

     }

     */
}(typeof require != 'undefined' && require('../') || Log));