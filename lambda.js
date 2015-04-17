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
        dppiUtils = {     //dppiUtils.invoking(callee,clause,[]);
            getFunctionArgumentList: function (fn) {
                if (isFunction(fn)) {
                    var reg = /^\s*function(?:\s+[^(\s]+)?\s*\(\s*([^)]*)\s*\)/;
                    var ret = reg.exec(fn);
                    return ret[1].split(",");
                } else return null;
            },
            getCallerExtValue: function (args) {
                var fn = args.callee;
                var defNames = this.getFunctionArgumentList(fn);
                var callParams = Array.prototype.slice.call(args);
                var extCount = callParams.length - defNames.length;
                var extValues = [];
                if (extCount) {
                    extValues = Array.prototype.slice.call(args, defNames.length);
                }
                return extValues;
            },
            invoking: function (/*Function*/fnCallee, /*Function*/clause, /*Array*/params, _self) {
                var extValues = this.getCallerExtValue(fnCallee.arguments, clause);
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
                fnDefine = _this.names.concat(["'use strict';\n"].concat(_this.body).join(""));
                return fnCreate(fnDefine);
            }
            _this.parse(condition, isClosure);
            if (_this.body && _this.names)
                return _this.compile();
            return null;
        },
        //version
        version: '20150417/01',

        isLambda: function (/*String*/condition) {
            return lambda.isLambda.call(this,condition);
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
                    str.push("}).call(this");
                    if (names.length > 0)str.push(',');
                    str.push(names);
                    str.push(")");
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
                body = body.slice(1, body.length - 1);
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

    lambda.isLambda= function (/*String*/condition) {
        condition = condition || this.condition;
        var oneArg = /^\s*(\w+)\s*=>(.+)$/;
        var manyArgs = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/;
        return (oneArg.exec(condition) || manyArgs.exec(condition))!==null;
    };

    lambda.config = config;

    return lambda;
});
