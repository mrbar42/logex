'use strict';

(function (Log) {


    Log.level = "info";

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
            Log.warn("invalid arguments. (I point myself)");
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