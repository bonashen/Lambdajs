/**
 * Created by bona on 2015/4/4.
 */
define(null, [], function () {

    //example1:
    // |  var isLambda = lambda("o=>o.split('=>').length>=2");
    // |  console.log("'o=>o' is lambda exp:",isLambda("o=>o"));
    // |
    // |example2:
    // |  require(['thirty/lambda',
    // |  'thirty/sbuilder'], function (lambda, sb) {
    // |    var user = {
    // |       name: 'bona shen',
    // |       getName: function () {
    // |           return this.name
    // |       }
    // |    };
    // |    var fn = lambda(sb('o=>').
    // |        append('(function(item){').
    // |        append('\n\titem.name = this.getName();').
    // |        append('\n}).call(this,o)').
    // |        toString());
    //      console.log(fn.toString());
    //|     var o = {};
    //|     fn.call(user, o);
    //|     console.log(o);
    //|});


    var lambda = function (/*String*/condition, /*Boolean*/isClosure) {
            var ret = new lambda.fn.init(condition, isClosure);
            if (ret.isLambda()) {
                return ret.compile();
            }
            return ret;
        },
        isNumber = function (str) {
            return /^[0-9]+$/.exec(str) ? true : false;
        },
        isFunction = function (it) {
            return it && (it instanceof Function || typeof(it) == 'function');
        },

        dppiUtils = {     //dppiUtils.invoking(callee,clause,[]);
            getFunctionArgumentList: function (fn) {
                if (isFunction(fn)) {
                    var reg = /^\s*function(?:\s+[^(\s]+)?\s*\(\s*([^)]*)\s*\)/;
                    var ret = reg.exec(fn);
                    return ret[1].split(",");
                } else return null;
            },
            getCallerExtValues: function (caller) {
                var extCount = this.getCallerExtCount(caller);
                var defNames = this.getFunctionArgumentList(caller);
                var extValues = [];
                if (extCount) {
                    extValues = Array.prototype.slice.call(caller.arguments, defNames.length);
                }
                return extValues;
            },
            getCallerExtCount: function (caller) {
                var fn = caller;
                var defNames = this.getFunctionArgumentList(fn);
                var callParams = Array.prototype.slice.call(fn.arguments);
                return callParams.length - defNames.length;
            },
            invoking: function (/*Function*/fnCaller, /*Function*/clause, /*Array*/params, _self) {
                var extValues = this.getCallerExtValues(fnCaller, clause);
                return clause.apply(_self, params.concat(extValues));
            }
        };

//cache
    var cache = {},
//config
        config = {
            isDebug: false,
            //option = {condition:condition,isClosure:isClosure}
            beforeParse: function (option) {
            },
            //option = {condition:condition,isClosure:isClosure,names:[],body:[]}
            afterParse: function (option) {
            }
        },
        isFunction = function (it) {
            return it && (it instanceof Function || typeof(it) === "function");
        };

    lambda.fn = lambda.prototype = {
        init: function (/*String*/condition, /*Boolean*/isClosure) {
            this.condition = condition;
            this.isClosure = isClosure;
            //this.clear();
        },
        //compiled function in strict mode or not.
        useStrict: true,
        compile: function (/*String*/condition, /*Boolean*/isClosure) {

            var _this = this,
                getCachefn = function (/*String*/codeBody) {
                    var ret = null;
                    if (cache[codeBody]) {
                        ret = cache[codeBody].method;
                        cache[codeBody].num += 1;
                    }
                    return ret;
                },
                fnCreate = function (body) {
                    var bodySrc = _this.getLambdaCode();
                    var fn = getCachefn(bodySrc);
                    if (!fn) {
                        fn = Function.apply(null, body);
                        cache[bodySrc] = {method: fn, num: 1};
                        if (config.isDebug) {
                            console.debug("lambda:\t", bodySrc);
                            console.debug(fn.toString());
                        }
                    }
                    return fn;
                };
            var fnDefine = [];
            if (arguments.length == 0 && _this.body && _this.names) {
                fnDefine = _this.names.concat([_this.useStrict ? "'use strict';\n" : "\n"].concat(_this.body).join(""));
                return fnCreate(fnDefine);
            }
            _this.parse(condition, isClosure);
            if (_this.body && _this.names)
                return _this.compile();
            return null;
        },
        //version
        version: '20150417/01',
        vendor: "bonashen.com",
        isLambda: function (/*String*/condition) {
            return lambda.isLambda.call(this, condition);
        },
        parse: function (/*String*/condition, /*Boolean*/isClosure) {
            var trim = function (str) {
                return str.replace(/(^\s*)|(\s*$)/g, '');
            };

            this.clear();
            var option = {
                condition: condition || this.condition,
                isClosure: isClosure || this.isClosure || false
            };

            if (isFunction(config.beforeParse))
                config.beforeParse.call(this, option);

            var cStr = option.condition.split('=>');
            isClosure = option.isClosure;

            var fnBody = [], fnNames = [], codeBody = null;

            if (cStr.length >= 2) {//when length>=2,process lambda.
                if (cStr[0].indexOf('(') === -1) {
                    fnNames = [cStr[0]];
                }
                else {
                    fnNames = cStr[0].replace(/\(/g, '').replace(/\)/g, '').split(',');
                }
                //remove name leading and tail space char.
                for (var i = 0; i < fnNames.length; i++)fnNames[i] = trim(fnNames[i]);

                codeBody = cStr.slice(1, cStr.length).join("=>");

                if (isClosure) {//true,insert closed function code.
                    var names = trim(fnNames.join(",")), str = [];
                    str.push(" (function(");
                    str.push(names);
                    str.push("){");
                    str.push(codeBody);
                    //str.push("}).call(this");
                    //if (names.length > 0)str.push(',');
                    //str.push(names);
                    //str.push(")");
                    str.push("}).apply(this,arguments)");
                    codeBody = str.join('');
                    //codeBody = " (function(" + names + "){" + codeBody + "}).call(this" + (names.length> 0 ? +("," + names) : "") + ")";
                    //console.log(codeBody);
                }
            }
            fnBody.push("return ");
            fnBody.push(codeBody);
            fnBody.push(" ;");

            option.names = fnNames;
            option.body = fnBody;

            if (isFunction(config.afterParse))
                config.afterParse.call(this, option);

            this.names = option.names;
            this.body = option.body;
            return this;
        },
        getNames: function () {
            this.names = this.names || [];
            return this.names;
        },
        getBody: function () {
            this.body = this.body || [];
            return this.body;
        },
        getSourceCode: function () {
            return this.compile().toString();
        },
        getLambdaCode: function () {
            var ret = "", body = this.getBody(), name = this.getNames();
            if (body.length > 0) {
                if (this.useStrict) body = body.slice(1, body.length - 1);
                name = ["("].concat([name.join(",")]).concat([")=>"]);
                ret = name.concat(body).join("");
            }
            return ret;
        },
        clear: function () {
            delete this.body;
            delete this.names;
        },
        invoking: function (/*Caller*/caller, /*Array*/params, /**/self) {

            var fn = this.compile();
            if (isFunction(caller))
                return dppiUtils.invoking(caller, fn, params, self);

            // |invoking: function( /*Array*/params, /**/self)
            // |invoking: function( /*Array*/params)
            return fn.apply(arguments[1], arguments[0]);
        }
    };

    lambda.fn.init.prototype = lambda.fn;

//static read lambda compile function cache.
    lambda.getCache = function () {
        var ret = [];
        for (var name in cache) {
            ret.push({lambda: name, method: cache[name].method, num: cache[name].num});
        }
        return ret;
    };

    lambda.resetCache = function () {
        cache = {};
    };

    lambda.parse = function (/*String*/condition, /*Boolean*/isClosure) {
        return lambda().parse(condition, isClosure);
    };

    lambda.compile = function (/*String*/condition, /*Boolean*/isClosure) {
        return lambda(condition, isClosure);
    };

    lambda.convert = function (/*String*/omittingArgsExp, /*Boolean*/isClosure) {

        var rxIds = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|[\$@\w_#]+/g;
        var str = omittingArgsExp;

        var totalExpArgsCount = function (rxIds, str) {
            var m, hint = [], ret = 0;
            rxIds.lastIndex = 0;
            var check = function (s, hint) {
                var ch = s.charAt(0);
                if (ch == "$") {
                    var l = s.length;
                    if (l >= 2 && s.charAt(1) == "$") {
                        hint[1] = 1;
                    } else {
                        hint[0] = 1;
                    }
                }
                //else if (ch == "@") {
                //    hint[0] = 1;
                //}
                else if (ch == "#" && isNumber(s.substr(1))) {
                    hint[parseInt(s.substr(1)) + 1] = 1;
                }
            };
            while (m = rxIds.exec(str)) {
                var s = m[0];
                check(s, hint);
            }
            ret = hint.length;
            hint = null;
            return ret;
        };

        var defArgs = [], l = totalExpArgsCount(rxIds, str), i = 0;
        for (; i < l; i++) {
            defArgs[i] = "_p_.p" + i;
        }

        rxIds.lastIndex = 0;
        str = str.replace(rxIds, function (s) {
            var ch = s.charAt(0);
            if (ch == "$") {
                var l = s.length;
                if (l >= 2 && s.charAt(1) == "$") {
                    return defArgs[1];
                } else {
                    return defArgs[0];
                }
            }
            else if (ch == "@") {
                //return defArgs[defArgs.length - 1];
                return "_p_.right";
            }
            else if (ch == "#" && isNumber(s.substr(1))) {
                return defArgs[(parseInt(s.substr(1)) + 1)];
            }
            return s;
        });
        var lm = lambda.parse("()=>0");
        lm.useStrict = false;

        str = isClosure ? "(function(){ " + str + " ;}).apply(this,arguments)" : str;

        var body = []
            .concat("return (")
            .concat('function (){\n')
            .concat('var fn = function(){\n')
            .concat('var getParams = function(){\n')
            .concat('var param = {};\n')
            .concat('for(var i=0;i<fn.arguments.length;i++){\n')
            .concat('param["p"+i]= fn.arguments[i];\n')
            .concat(' }\n')
            .concat('param[\'right\'] = fn.arguments[fn.arguments.length-1];\n')
            .concat(' return param;\n')
            .concat(' }; \n')
            .concat('  var _p_ = getParams();\n')
            .concat(['return ', str, '; \n'])       //insert code.
            .concat(' };\n')
            .concat('return fn.apply(this,arguments);\n')
            .concat('}\n')
            .concat(").apply(this,arguments)");

        var lmBody = lm.getBody();
        lmBody.length = 0;
        for (i = 0; i < body.length; i++)lmBody[i] = body[i];

        defArgs = lmBody = body = null;
        return lm.compile();
    };

    lambda.isLambda = function (/*String*/condition) {
        condition = condition || this.condition;
        var oneArg = /^\s*(\w+)\s*=>(.+)$/;
        var manyArgs = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/;
        return (oneArg.exec(condition) || manyArgs.exec(condition)) !== null;
    };

    lambda.config = config;

    //lambda.dppiUtils = dppiUtils;

//exports
    (function () {
        var platform;

        var platformList = {
            'nodejs': function () {
                return typeof module !== 'undefined' && module.exports;
            },
            'web': function () {
                return true;
            }
        };

        for (var key in platformList) {
            if (platformList[key]()) {
                platform = key;
                break;
            }
        }

        if (platform == 'nodejs') {
            module.exports = lambda;
        } else {
            window.lambda = lambda;
        }

    })();

    return lambda;
})
;
