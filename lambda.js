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
    };

    lambda.fn = lambda.prototype = {
        init: function (condition, isClosure) {
            this.condition = condition;
            this.isClosure = isClosure;
            this.clear();
        },
        compile: function (condition, isClosure) {
            var fnCreate = function (body) {
                return Function.apply(null, body);
            };
            var fnDefine=[];
            if(arguments.length==0&&this.body.count>0&&this.names){
                fnDefine = this.names.concat(this.body);
            }
            else {
                fnDefine = this.parse(condition, isClosure);
                fnDefine = fnDefine ? fnDefine.merge() : fnDefine;
            }
            return fnCreate(fnDefine);
        },
        isLambda: function (condition) {
            condition = condition || this.condition;
            return condition ? condition.split("=>").length >= 2 : false;
        },
        parse: function (condition, isClosure) {
            var cStr = (condition || this.condition).split('=>');
            isClosure = isClosure || this.isClosure || false;

            var fnBody = [], fnNames = [];

            if (cStr.length >= 2) {//when length>=2,process lambda.
                if (cStr[0].indexOf('(') === -1) {
                    fnNames = [cStr[0]];
                }
                else {
                    fnNames = cStr[0].replace(/\(/g, '').replace(/\)/g, '').split(',');
                }
                var codeBody = cStr.slice(1, cStr.length).join("=>");
                if (isClosure) {//true,insert closed function code.
                    var names = fnNames.join(",");
                    codeBody = " (function(" + names + "){" + codeBody + "}).call(this," + names + ")";
                }
            }
            fnBody.push("return " + codeBody + " ;");

            this.names = fnNames;
            this.body = fnBody;

            return {
                names: fnNames, body: fnBody, merge: function () {
                    return this.names.concat(this.body);
                }
            };
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
        clear:function(){
            this.body=['return ;'];
            this.names=[];
        }
    };

    lambda.fn.init.prototype = lambda.fn;

    return lambda;
});
