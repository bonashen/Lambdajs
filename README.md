# Lambda.js
支持dojo AMD加载规范，实现动态编译Lambda规范字符串表达式为匿名函数，支持闭包函数体,具体请查看[博客](http://www.bonashen.com/post/develop/ria-develop/2015-04-08-javascript-lambda-bian-yi-qi-shi-xian)。


- 表达式应用

```javascript
var add = function(x,y){return x+y;}               //通常写法
var add = lambda("(x,y)=>x+y");                   //转换为lambda
console.log(add.toString());                          //输出lambda编译后的源代码
```
Lambda编译后源代码如下：
```javascript
function anonymous(x, y) {
return x+y ;
}
```
在[JSLINQ](http://jslinq.codeplex.com/)使用中例子:
```javascript
var fromq= JSLINQ([1, 2, 3]).Where(lambda("o=>o>2"));
```

----

- 函数体，即闭包（Closure）
```javascript
var each = function(callback){
    for(var index=0;index<this.items.length;index++)
         if(callback(item,index))break;
}
var callback = function(item,index){            //通常写法
      if(index>100)return true; 
      console.log(item);
      };
//转换为lambda
var callback = lambda("(item,index)=>if(index>100)return true;console.log(item)",true);      
each(callback);                                        //只输出前100个元素
console.log(callback.toString());                 //输出lambda编译后的源代码
```
Lambda编译后源代码如下：
```javascript
function anonymous(item, index) {
  return  (function(item,index){
        if(index>100)
           return true;
        console.log(item)
   }).call(this,item,index) ;
}
```
在[JSLINQ](http://jslinq.codeplex.com/)使用中例子:
```javascript
var People =  
    [
        { ID: 1, FirstName: "Chris", LastName: "Pearson" },
        { ID: 2, FirstName: "Kate", LastName: "Johnson" },
        { ID: 3, FirstName: "Josh", LastName: "Sutherland" }
    ];
var fromq= JSLINQ(People).Each(lambda("o=>o.Name = o.FirstName+' '+o.LastName",true));
fromq = fromq.Select(lambda("o=>{Name:o.FirstName+' '+o.LastName}"));
```

- 缓存功能
Lambda增加了Cache功能，所有经Lambda编译后的表达式都会在后台缓存，如有相同的表达式时，Lambda只进行分析后找到缓存的匿名方法实现并返回，这样减少了Function的调用，使速度更快，另还针对缓存的Lambda表达式进行了使用次数的统计，这样可以查看某个表达式的使用情况。

```javascript
var src = "(o,i)=>console.log(o)";
var afn = lambda(src), bfn = lambda(src);
console.log(afn === bfn); //true
var cache = lambda.getCache();
for (var i = 0; i < cache.length; i++) {
    console.log("lambda:", cache[i].lambda, "  useCount:", cache[i].num);
}

```
