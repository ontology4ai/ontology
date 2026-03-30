### 1、数据类型
#### Number类型
数字类型,支持四种类型,分别是long,double,java.math.BigInteger(简称 big int)和java.math.BigDecimal(简 称 decimal),规则如下:
任何以大写字母 N 结尾的整数都被认为是 big int
任何以大写字母 M 结尾的数字都被认为是 decimal
其他的任何整数都将被转换为 Long
其他任何浮点数都将被转换为 Double
超过 long 范围的整数字面量都将自动转换为 big int 类型
#### String类型
字符串类型,单引号或者双引号括起来的文本串,如'hello world', 变量如果传入的是String或者Character也将转为String类型。
#### Bool类型
常量true和false,表示真值和假值,与 java 的Boolean.TRUE和Boolean.False对应。
#### Pattern类型
正则表达式, 以//括起来的字符串,如/\d+/,内部 实现为java.util.Pattern
#### 变量类型
与 Java 的变量命名规则相同,变量的值由用户传入
#### nil类型
常量nil,类似 java 中的null,但是nil比较特殊,nil不仅可以参与==、!=的比较, 也可以参与>、>=、<、<=的比较,Aviator 规定任何类型都大于nil除了nil本身,nil==nil返回true。 用户传入的变量值如果为null,那么也将作为nil处理,nil打印为null。

### 2、操作符
#### 算术运算符
Aviator 支持常见的算术运算符,包括+ - * / %五个二元运算符,和一元运算符-(负)。其中- * / %和一元的-仅能作用于Number类型。
+不仅能用于Number类型,还可以用于String的相加,或者字符串与其他对象的相加。
Aviator 规定,任何类型与String相加,结果为String。

#### 逻辑运算符
Avaitor 的支持的逻辑运算符包括,一元否定运算符!,以及逻辑与的&&,逻辑或的||。逻辑运算符的操作数只能为Boolean。
&&和||都执行短路规则。

#### 关系运算符
Aviator 支持的关系运算符包括<, <=, >, >=以及==和!= 。
关系运算符可以作用于Number之间、String之间、Pattern之间、Boolean之间、变量之间以及其他类型与nil之间的关系比较, 不同类型除了nil之外不能相互比较。

#### 位运算符
Aviator 支持所有的 Java 位运算符,包括&, |, ^, ~, >>, <<, >>>。

#### 匹配运算符
匹配运算符=~用于String和Pattern的匹配,它的左操作数必须为String,右操作数必须为Pattern。 匹配成功后,Pattern的分组将存于变量$num,num为分组索引。

#### 三元运算符
Aviator 没有提供if else语句,但是提供了三元运算符?:,形式为bool ? exp1: exp2。 其中bool必须为Boolean类型的表达式, 而exp1和exp2可以为任何合法的 Aviator 表达式,并且不要求exp1和exp2返回的结果类型一致。


### 3、用法举例
#### 三元表达式
```
("a>0? 'yes':'no'", 1)  // yes
```

#### 字符串基本用法
```
map.put("userName","kevin")//数据中存在userName字段，值为kevin
表达式如下：
(" 'a\"b' ")           // 字符串 a"b
(" \"a\'b\" ")         // 字符串 a'b
(" 'hello ' + 3")     // 字符串 hello 3
(" 'hello '+ unknow") // 字符串 hello null
(" 'hello '+ userName") // 字符串 hello kevin
```

#### nil对象
nil是 Aviator 内置的常量,类似 java 中的null,表示空的值。nil跟null不同的在于,在 java 中null只能使用在==、!=的比较运算符,而nil还可以使用>、>=、<、<=等比较运算符。 Aviator 规定,任何对象都比nil大除了nil本身。用户传入的变量如果为null,将自动以nil替代。
```
("nil == nil");   //true
("3> nil");      //true
("true!= nil");  //true
("''>nil ");    //true
("a==nil ");     //true, a 是 null
```

#### 日期比较
Aviator 并不支持日期类型,如果要比较日期,你需要将日期写字符串的形式,并且要求是形如 “yyyy-MM-dd HH:mm:ss:SS”的字符串,否则都将报错。 字符串跟java.util.Date比较的时候将自动转换为Date对象进行比较。
```
map.put("data",new Date()) //数据中存在date字段，值为当前时间
表达式如下：
("date > '2010-12-20 00:00:00:00'"）// true
("date < '2200-12-20 00:00:00:00'"）// true
```
### 系统函数
| 函数名称| 说明 |
|----|----|
|assert(predicate, [msg])|断言函数，当 predicate 的结果为 false 的时候抛出 AssertFailed 异常， msg 错误信息可选。
|sysdate()	|返回当前日期对象 java.util.Date
|rand()	|返回一个介于 [0, 1) 的随机数，结果为 double 类型
|rand(n)	|返回一个介于 [0, n) 的随机数，结果为 long 类型
|cmp(x, y)|比较 x 和 y 大小，返回整数，0 表示相等， 1 表达式 x > y，负数则 x < y。
|print([out],obj)	|打印对象,如果指定 out 输出流，向 out 打印， 默认输出到标准输出
|println([out],obj)或者p([out], obj)|与 print 类似,但是在输出后换行
|pst([out], e)|等价于 e.printStackTrace()，打印异常堆栈，out 是可选的输出流，默认是标准错误输出
|now()	|返回 System.currentTimeMillis() 调用值
|long(v)	|将值转为 long 类型
|double(v)	|将值转为 double 类型
|boolean(v)	|将值的类型转为 boolean，除了 nil 和 false，其他都值都将转为布尔值 true。
|str(v)	|将值转为 string 类型
|bigint(x)|将值转为 bigint 类型
|decimal(x)|将值转为 decimal 类型
|identity(v)	|返回参数 v 自身，用于跟 seq 库的高阶函数配合使用。
|type(x)|返回参数 x 的类型，结果为字符串，如 string, long, double, bigint, decimal, function 等。Java  类则返回完整类名。
|is_def(x)|返回变量 x 是否已定义（包括定义为 nil），结果为布尔值
|undef(x)|“遗忘”变量  x，如果变量 x 已经定义，将取消定义。
|range(start, end, [step])|创建一个范围，start 到 end 之间的整数范围，不包括 end， step 指定递增或者递减步幅。
|tuple(x1, x2, ...)|创建一个 Object 数组，元素即为传入的参数列表。
|eval(script, [bindings], [cached])|对一段脚本文本 script 进行求值，等价于 AviatorEvaluator.execute(script, env, cached)

### 字符串函数
| 函数名称| 说明 |
|----|----|
|date_to_string(date,format)	|将 Date 对象转化化特定格式的字符串,2.1.1 新增
|string_to_date(source,format)	|将特定格式的字符串转化为 Date 对 象,2.1.1 新增
|string.contains(s1,s2)	|判断 s1 是否包含 s2,返回 Boolean
|string.length(s)	|求字符串长度,返回 Long
|string.startsWith(s1,s2)	|s1 是否以 s2 开始,返回 Boolean
|string.endsWith(s1,s2)	|s1 是否以 s2 结尾,返回 Boolean
|string.substring(s,begin[,end])	|截取字符串 s,从 begin 到 end,如果忽略 end 的话,将从 begin 到结尾,与 java.util.String.substring 一样。
|string.indexOf(s1,s2)	|java 中的 s1.indexOf(s2),求 s2 在 s1 中 的起始索引位置,如果不存在为-1
|string.split(target,regex,[limit])	|Java 里的 String.split 方法一致,2.1.1 新增函数
|string.join(seq,seperator)	|将集合 seq 里的元素以 seperator 为间隔 连接起来形成字符串,2.1.1 新增函数
|string.replace_first(s,regex,replacement)	|Java 里的 String.replaceFirst 方法, 2.1.1 新增
|string.replace_all(s,regex,replacement)	|Java 里的 String.replaceAll 方法 , 2.1.1 新增

### 数学函数
| 函数名称| 说明 |
|----|----|
|math.abs(d)	|求 d 的绝对值
|math.sqrt(d)	|求 d 的平方根
|math.pow(d1,d2)|	求 d1 的 d2 次方
|math.log(d)	|求 d 的自然对数
|math.log10(d)	|求 d 以 10 为底的对数
|math.sin(d)	|正弦函数
|math.cos(d)	|余弦函数
|math.tan(d)	|正切函数

### Sequence 函数（集合处理）
| 函数名称| 说明 |
|----|----|
|seq.array(clazz, e1, e2,e3, ...)	|创建一个指定 clazz 类型的数组，并添加参数 e1,e2,e3 ...到这个数组并返回。 clazz 可以是类似 java.lang.String 的类型，也可以是原生类型，如 int/long/float 等
|seq.array_of(clazz, size)|创建 clazz 类型的数组，大小为 size 指定。clazz 同 seq.array 定义。
|seq.list(p1, p2, p3, ...)	|创建一个 java.util.ArrayList 实例，添加参数到这个集合并返回。
|seq.set(p1, p2, p3, ...)	|创建一个 java.util.HashSet 实例，添加参数到这个集合并返回。
|seq.map(k1, v1, k2, v2, ...)	|创建一个 java.util.HashMap 实例，参数要求偶数个，类似 k1,v1 这样成对作为 key-value 存入 map，返回集合。
|seq.entry(key, value)|创建 Map.Entry 对象，用于 map, filter 等函数
|into(to_seq, from_seq)|用于 sequence 转换，将 from sequence 的元素使用 seq.add 函数逐一添加到了 to sequence 并返回最终的 to_seq
|seq.contains_key(map, key)	|当 map 中存在 key 的时候（可能为 null），返回 true。对于数组和链表，key 可以是 index，当 index 在有效范围[0..len-1]，返回 true，否则返回 false
|seq.add(coll, element)或者seq.add(m, key, value)|往集合 coll 添加元素，集合可以是 java.util.Collection，也可以是 java.util.Map（三参数版本）
|seq.put(coll, key, value)|类似 List.set(i, v)。用于设置 seq 在 key 位置的值为 value，seq 可以是 map ，数组或者 List。 map 就是键值对， 数组或者 List 的时候， key 为索引位置整数，value即为想要放入该索引位置的值。
|seq.remove(coll, element)	|从集合或者 hash map 中删除元素或者 key
|seq.get(coll, element)	|从 list、数组或者 hash-map 获取对应的元素值，对于 list 和数组， element 为元素的索引位置（从 0 开始），对于 hash map 来说， element 为 key。
|map(seq,fun)	|将函数 fun 作用到集合 seq 每个元素上, 返回新元素组成的集合
|filter(seq,predicate)	|将谓词 predicate 作用在集合的每个元素 上,返回谓词为 true 的元素组成的集合
|count(seq)	|返回集合大小，seq 可以是数组，字符串，range ，List 等等
|include(seq,element)	|判断 element 是否在集合 seq 中,返回 boolean 值，对于 java.uitl.Set 是 O(1) 时间复杂度，其他为 O(n)
|sort(seq)	|排序集合,仅对数组和 List 有效,返回排 序后的新集合
|reduce(seq,fun,init)	|fun 接收两个参数,第一个是集合元素, 第二个是累积的函数,本函数用于将 fun 作用在结果值（初始值为 init 指定)和集合的每个元素上面，返回新的结果值；函数返回最终的结果值
|seq.every(seq, fun)	|fun 接收集合的每个元素作为唯一参数，返回 true 或 false。当集合里的每个元素调用 fun 后都返回 true 的时候，整个调用结果为 true，否则为 false。
|seq.not_any(seq, fun)	|fun 接收集合的每个元素作为唯一参数，返回 true 或 false。当集合里的每个元素调用 fun 后都返回 false 的时候，整个调用结果为 true，否则为 false。
|seq.some(seq, fun)	|fun 接收集合的每个元素作为唯一参数，返回 true 或 false。当集合里的只要有一个元素调用 fun 后返回 true 的时候，整个调用结果立即为该元素，否则为 nil。
|seq.eq(value)	|返回一个谓词,用来判断传入的参数是否跟 value 相等,用于 filter 函数,如filter(seq,seq.eq(3)) 过滤返回等于3 的元素组成的集合
|seq.neq(value)	|与 seq.eq 类似,返回判断不等于的谓词
|seq.gt(value)	|返回判断大于 value 的谓词
|seq.ge(value)	|返回判断大于等于 value 的谓词
|seq.lt(value)	|返回判断小于 value 的谓词
|seq.le(value)	|返回判断小于等于 value 的谓词
|seq.nil()	|返回判断是否为 nil 的谓词
|seq.exists()	|返回判断不为 nil 的谓词
|seq.and(p1, p2, p3, ...)	|组合多个谓词函数，返回一个新的谓词函数，当今仅当 p1、p2、p3 ...等所有函数都返回 true 的时候，新函数返回 true
|seq.or(p1, p2, p3, ...)	|组合多个谓词函数，返回一个新的谓词函数，当 p1, p2, p3... 其中一个返回 true 的时候，新函数立即返回 true，否则返回 false。
|seq.min(coll)	|返回集合中的最小元素，要求集合元素可比较（实现 Comprable 接口），比较规则遵循 aviator 规则。
|seq.max(coll)	|返回集合中的最大元素，要求集合元素可比较（实现 Comprable 接口），比较规则遵循 aviator 规则。

### 自定义函数
|函数名称| 说明 |
|----|----|
|sha1(key) | 对key做sha1加密
|sha1(key,n) | 对key做sha1加密后截取，如果n>0,截取0~n位，如果n<0,截取最后n位。
|str_date_format(dateStr,sourceFormate,targetFormate) | 将字符串时间（sourceFormate格式）按targetFormate格式化后输出。举例：str_date_format('20190613','yyyyMMdd','yyyy-MM-dd HH:mm:ss')
|md5(key) | 将key做md5加密
|dayOfWeek(dataStr,sourceFormate) | 计算dataStr表示的星期的整数值，其中sourceFormate为dataStr的日期格式。整数取值范围为：周日=1,周一=2,周二=3,周三=4,周四=5,周五=6,周六=7,
|concat(str1,str2,....) | 将多个字符串拼接，支持不定长参数
|isNotBlank(str) | 判断字符串str是否为空。``` isNotBlank(null)      = false;isNotBlank("") = false; isNotBlank(" ") =false; isNotBlank("bob") = true; isNotBlank("  bob  ") = true ```
|subStr(obj,start,length) | 截取obj对应的值的子串，其中start为起始位置，从0开始，length为待截取的长度，如果超过字符串的长度，则截取到最后一位。其中obj可以为整数或字符串，返回结果为字符串。``` subStr('abcdef', 0, 2)=ab; subStr('abcdef', 1, 2)=bc; subStr('abcdef', 2, 3)=def; subStr('abcdef', 3, 6)=def; subStr(123456, 2, 3)=345 ```
|has('o1,o2',obj) | 判断obj的值是否为指定值o1或者o2，其中obj为字符串或整数，返回值为布尔类型。``` has('1,2,3',1)      =true;in('a,1','a') = true; has('1,2,a','b') =false;  ```
|timeSplit(timeStr,dateFormatStr,splitNum,unit) | 将字符串类型时间timeStr按照给定的格式dateFormatStr处理后，按照splitNum和unit做时间切片，其中unit为second,minuter,day之一，splitNum为需要切分的维度。``` timeSplit('2019-09-17 09:00:00','yyyy-MM-dd HH:mm:ss',5,'second')=1568682000; timeSplit('2019-09-17T09:00:00',"yyyy-MM-dd'T'HH:mm:ss",1,"day")=1568419200 ```
|uuid([n]) | 生成uuid，存在大小写字符,n为uuid长度，默认8位
|lower(str) | 将str转为小写
|upper(str) | 将str转为大写
|json(jsonStr,reg) | 通过jsonPath解析json字段，其中jsonStr为json串，reg为jsonPath表达式（不包含$）```json(jsonStr,'column.addr')```
|split_csv(字段,'分隔符',位置) | 解析 csv格式的string 用法
|trim34(str) | 去掉前后\" 函数
| split61str(str,name)| 解析  xxx=xx 这样格式的 获取后面的值
|base64(str)| 对目标字段进行base64加密,可以指定编码格式。```base64(str,'utf8')```
|base64_decode(str)| 对目标字段进行base64解密,可以指定编码格式。```base64_decode(str,'utf8')```


