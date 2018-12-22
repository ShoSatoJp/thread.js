var Clone = Clone || (function CloneImplimentation() {
    const GLOBAL = (0, eval)('this');
    GLOBAL.CloneImplimentation = CloneImplimentation;
    const Clone = function (any) {
        return clone(any, true, false);
    };
    Clone.prototype.reverse = function () {
        return reverse(this);
    };
    Clone.prototype.stringify = function () {
        return JSON.stringify(this);
    };
    Clone.prototype.search = function (f) {
        return search(f, this);
    };
    Clone.prototype.searchFirst = function (f) {
        return searchFirst(f, this);
    };
    Clone.prototype.searchById = function (id) {
        return searchById(id, this);
    }
    const CLONE_RESULTS = [];

    function isPrimitive(arg) {
        var type = typeof arg;
        return arg == null || (type != "object" && type != "function");
    }
    /**
     *
     *
     * @param {*} any
     * @param {boolean} [useglobaltree=false] native codeのパス解決のためにグローバルオブジェクトのクローンを使用するか
     * @param {boolean} [withref=false] parentプロパティ、対象オブジェクトへの参照プロパティを作成するか。JSON化するときはfalseにする。
     * @param {*} [function_formatter=null]
     * @returns
     */
    function clone(any, useglobaltree = true, withref = false, exclude = [], source_embedding = false, usedepth = false, function_formatter = null) {
        var i = 0;
        var cloned = [];
        let depth = -1;

        if (useglobaltree) {
            Clone.GLOBAL_TREE = Clone.GLOBAL_TREE || clone(GLOBAL, false, true, Clone.GLOBAL_EXCLUDE);
        }

        function cloneObject(obj, parent) {
            var tree = [];
            var props = Object.getOwnPropertyDescriptors(obj);
            for (const key in props) {
                tree.push(cloneInsideObject(props[key].value, key, parent));
            }
            var proto = cloneInsideObject(Object.getPrototypeOf(obj), '__proto__', parent);
            tree.push(proto);
            return tree;
        }


        //こっちを呼ぶ
        function cloneInsideObject(e, name, parent) {
            var id = i++;
            if (usedepth) depth++;

            do {
                if (e === CLONE_RESULTS || CLONE_RESULTS.includes(e)) {
                    var result = {
                        type: "ClonedObject",
                        name: name,
                        id: id,
                        value: undefined,
                    };
                    break;
                }

                if (exclude.includes(e)) {
                    var result = {
                        type: "ExcludeObject",
                        name: name,
                        id: id,
                        value: undefined,
                    };
                    break;
                }

                var primitive_type;
                switch (e) {
                    case undefined:
                        primitive_type = 'Undefined';
                        break;
                    case -Infinity:
                        primitive_type = '-Infinity';
                        break;
                    case Infinity:
                        primitive_type = 'Infinity';
                        break;
                    default:
                        if (Number.isNaN(e)) primitive_type = 'NaN';
                        break;
                }
                if (primitive_type) {
                    var result = {
                        type: primitive_type,
                        name: name,
                        id: id,
                    };
                    break;
                }

                if (isPrimitive(e)) {
                    var result = {
                        type: "Primitive",
                        name: name,
                        id: id,
                        value: e
                    };
                    break;
                }
                // 特殊__proto__ : Object.prototype
                if (e === Object.prototype) {
                    var result = {};
                    Object.assign(result, {
                        type: "Object.prototype",
                        name: name,
                        id: id,
                    });
                    break;
                }
                if (e === Function.prototype) {
                    var result = {};
                    Object.assign(result, {
                        type: "Function.prototype",
                        name: name,
                        id: id,
                    });
                    break;
                }


                var c = cloned.filter(x => x.ref === e);
                if (!c.length) {
                    cloned.push({
                        ref: e,
                        id: id
                    });
                    if (e instanceof Function && typeof e === 'function') {
                        var isGenerator = isGeneratorFunction(e);
                        var isAsync = isAsyncFunction(e);
                        var isBound = isBoundFunction(e);
                        var isNative = isNativeFunction(e);
                        // console.log('name',name,'e.name',e.name)
                        var result = {
                            name: name || e.name,
                            isNative: !!isNative,
                            isBound: !!isBound,
                            isGenerator: !!isGenerator,
                            isAsync: !!isAsync,
                            type: "Function",
                            id: id,
                        };
                        if (isBound) result.name = name;
                        if (!isGenerator && useglobaltree && isNative) {
                            var func = search(x => x.ref === e, Clone.GLOBAL_TREE)[0];
                            if (func === undefined) {
                                console.log(parent);
                                console.log(e);
                            }
                            result.path = path(func);
                        }
                        var function_string = e.toString();
                        if (function_formatter) function_string = function_formatter(function_string);
                        if (source_embedding) function_string = function_string.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
                        var child = !isNative ? cloneObject(e, result) : undefined;
                        if (child) {
                            var exclude_property = ['arguments', 'caller', 'callee']
                            child = child.filter(x => !exclude_property.includes(x.name));
                        }
                        Object.assign(result, {
                            value: function_string,
                            child: child,
                        });
                        break;
                    }
                    if (e instanceof Array) {
                        var result = {};
                        Object.assign(result, {
                            type: "Array",
                            name: name,
                            id: id,
                            child: e.map(x => cloneInsideObject(x, null, result))
                        });
                        break;
                    }
                    if (e instanceof Date) {
                        var result = {
                            type: "Date",
                            name: name,
                            id: id,
                            value: e.getTime()
                        };
                        break;
                    }
                    if (e instanceof RegExp) {
                        var result = {
                            type: "RegExp",
                            name: name,
                            id: id,
                            value: e.toString()
                        };
                        break;
                    }
                    if (e instanceof String) {
                        var result = {
                            type: "String",
                            name: name,
                            id: id,
                            value: e.toString()
                        };
                        break;
                    }
                    if (e instanceof Number) {
                        var result = {
                            type: "Number",
                            name: name,
                            id: id,
                            value: e.valueOf()
                        };
                        break;
                    }
                    if (e instanceof Boolean) {
                        var result = {
                            type: "Boolean",
                            name: name,
                            id: id,
                            value: e.valueOf()
                        };
                        break;
                    }
                    if (e instanceof Error) {
                        let errortype = isNativeFunction(e.constructor);
                        var msg;
                        try {
                            msg = e.message;
                        } catch (error) {
                            msg = error;
                        }
                        var result = {
                            type: "Error",
                            errorType: errortype,
                            name: name,
                            id: id,
                            value: msg,
                            child: cloneObject(e, result),
                        };
                        break;
                    }
                    if (e instanceof Map) {
                        var result = {};
                        var children = [];
                        Array.from(e.keys()).forEach(k => {
                            children.push(cloneInsideObject(k, null, result));
                            children.push(cloneInsideObject(e.get(k), null, result));
                        });
                        Object.assign(result, {
                            type: "Map",
                            name: name,
                            id: id,
                            child: children,
                        });
                        break;
                    }
                    if (e instanceof Set) {
                        var result = {};
                        Object.assign(result, {
                            type: "Set",
                            name: name,
                            id: id,
                            child: Array.from(e).map(x => cloneInsideObject(x, null, result))
                        });
                        break;
                    }

                    // e はオブジェクト
                    var result = {};
                    var child = cloneObject(e, result);
                    if (name === '__proto__') {
                        var exclude_property = ['arguments', 'caller', 'callee']
                        child = child.filter(x => !exclude_property.includes(x.name));
                    }
                    Object.assign(result, {
                        type: "Object",
                        name: name,
                        id: id,
                        child: child,
                    });
                    break;
                } else {
                    //循環参照回避・同一参照重複回避
                    var result = {
                        type: "Reference",
                        name: name,
                        value: undefined,
                        id: id,
                        ref_id: c[0].id
                    };
                    break;
                }
            }
            while (0);

            if (withref) {
                result.ref = isPrimitive(e) ? undefined : e;
                result.parent = parent;
            }
            if (usedepth) result.depth = depth--;
            Object.setPrototypeOf(result, Clone.prototype);
            return result;
        }
        var result = cloneInsideObject(any, null, null);
        CLONE_RESULTS.push(result); //クローン結果オブジェクトのクローン回避
        return result;
    }


    /**
     * @callback reverse~evalimport
     * @param {string} src - evalする対象
     * @returns {Function} - evalで生成された関数
     * @example
     *      src => eval(src)
     */

    /**
     *
     *
     * @param {*} node
     * @param {reverse~evalimport} [evalimport=src => (0, eval)(src)] - 関数の[[Scope]]にするスコープでeval(src)したコールバック関数デフォルトはグローバルスコープ
     * @param {*} [top=node]
     * @returns
     */
    function reverse(node, evalimport = src => (0, eval)(src), top = node) {
        function exec(node, top = node, class_ref = null) {
            var e;
            var value = node.value;
            switch (node.type) {
                case 'Undefined':
                    e = node.ref = undefined;
                    break;
                case 'Infinity':
                    e = node.ref = Infinity;
                    break;
                case '-Infinity':
                    e = node.ref = -Infinity;
                    break;
                case 'NaN':
                    e = node.ref = NaN;
                    break;
                case "Primitive":
                    e = node.ref = node.value;
                    break;
                case "Function":
                    var f;
                    if (node.isBound) {
                        //bound functionだけはコピーできない
                        e = node.ref = 'BoundFunction';
                        break;
                    } else if (node.isNative) {
                        //native function
                        if ('path' in node) {
                            var t = unpath(node.path);
                            e = node.ref = t;
                            break;
                        } else {
                            e = node.ref = 'NativeFunction';
                            break;
                        }
                    } else {
                        //その他 function class function* async
                        f = evalimport(`(${classifyFunction(value,{name:node.name}).source})`);
                        // try {
                        //     f = evalimport(`(${value})`);
                        // } catch (error) {
                        //     f = evalimport(`(function ${value})`);
                        // }
                        e = node.ref = f;
                        node.child.forEach(x => {
                            x.parent_ref = f;
                            x.parent = node;
                            // var target = f[x.name] || {};
                            var object = exec(x, top);
                            if (x.name === '__proto__') {
                                Object.setPrototypeOf(f, object || null);
                            } else {
                                f[x.name] = object;
                            }
                            // if (x.name === 'name') {
                            //     console.log(node, x, object, f.name)
                            // }
                            // console.log(object)
                            // for (const key in object) {
                            //     // console.log(key)
                            //     if (object.hasOwnProperty(key)) {
                            //         // console.log(key)
                            //         target[key] = object[key];
                            //     }
                            // }
                            // f[x.name] = target;
                        });
                        break;
                    }
                case "Array":
                    var array = [];
                    e = node.ref = array;
                    node.child.forEach(x => {
                        x.parent = node;
                        x.parent_ref = e;
                        array.push(exec(x, top));
                    });
                    break;
                case "Date":
                    e = node.ref = new Date(value);
                    break;
                case "RegExp":
                    e = node.ref = new RegExp(value);
                    break;
                case "String":
                    e = node.ref = new String(value);
                    break;
                case "Number":
                    e = node.ref = new Number(value);
                    break;
                case "Boolean":
                    e = node.ref = new Boolean(value);
                    break;
                case "Error":
                    var obj;
                    switch (node.errorType) {
                        case 'TypeError':
                            obj = new TypeError(value);
                            break;
                        case 'EvalError':
                            obj = new EvalError(value);
                            break;
                        case 'RangeError':
                            obj = new RangeError(value);
                            break;
                        case 'ReferenceError':
                            obj = new ReferenceError(value);
                            break;
                        case 'SyntaxError':
                            obj = new SyntaxError(value);
                            break;
                        case 'URIError':
                            obj = new URIError(value);
                            break;
                        default:
                            obj = new Error(value);
                            break;
                    }
                    e = node.ref = obj;
                    node.child.forEach(x => {
                        x.parent = node;
                        x.parent_ref = obj;
                        obj[x.name] = exec(x, top, class_ref);
                    });
                    break;
                case "Map":
                    var temp = new Map();
                    e = node.ref = temp;
                    var key;
                    node.child.forEach((x, i) => {
                        if (i % 2 === 0) {
                            key = exec(x, top);
                        } else {
                            temp.set(key, exec(x, top));
                        }
                    });
                    break;
                case "Set":
                    e = node.ref = new Set(node.child.map(x => exec(x, top)));
                    break;
                case "Object":
                    var obj = {};
                    e = node.ref = obj;
                    node.child.forEach(x => {
                        x.parent = node;
                        x.parent_ref = obj;
                        if (x.name === '__proto__') { //todo setprototype
                            Object.setPrototypeOf(obj, exec(x, top) || null);
                        } else {
                            obj[x.name] = exec(x, top);
                        }
                    });
                    break;
                case "Reference":
                    var t = searchById(node.ref_id, top)
                    e = node.ref = t ? t.ref : 'ReferenceNotFound';
                    break;
                case 'Object.prototype':
                    e = node.ref = Object.prototype;
                    break;
                case 'Function.prototype':
                    e = node.ref = Function.prototype;
                    break;
                default:
                    console.log(node);
                    throw new TypeError(`「${node.type}」は非対応型です`);
            }
            return e;
        }
        return exec(node, top);
    }



    function searchById(id, tree) {
        if (tree.id === id) {
            return tree;
        } else {
            if (tree.child) {
                var array = tree.child
                    .map(x => {
                        return searchById(id, x);
                    })
                    .filter(x => x);
                return array.length ? array[0] : undefined;
            } else {
                return undefined;
            }
        }
    }

    function searchFirst(f, tree = Clone.GLOBAL_TREE) {
        var result;
        if (f(tree)) return tree;

        function exec(tree) {
            if (tree.child) {
                for (let i = 0, len = tree.child.length; i < len; i++) {
                    const el = tree.child[i];
                    if (f(el)) {
                        result = el;
                        return true;
                    } else {
                        if (exec(el)) return true;
                    }
                }
            }
            return false;
        }

        exec(tree);
        return result;
    }

    function search(f, tree = Clone.GLOBAL_TREE) {
        var result = [];
        if (f(tree)) result.push(tree);

        function exec(tree) {
            if (tree.child) {
                for (let i = 0, len = tree.child.length; i < len; i++) {
                    const el = tree.child[i];
                    if (f(el)) result.push(el);
                    exec(el);
                }
            }
        }

        exec(tree);
        return result;
    }

    //globalからのpath
    function path(node) {
        if (!('parent' in node)) throw new Error();
        var stack = [node];
        var current = node;
        while (current.parent) {
            stack.unshift(current.parent);
            current = current.parent;
        }
        stack.shift();
        return stack.map(x => x.name ? x.name : '');
    }

    function unpath(path) {
        var current = GLOBAL;
        for (let i = 0, len = path.length; i < len; i++) {
            const x = path[i];
            current = x === '__proto__' ? Object.getPrototypeOf(current) : current[x];
            if (current === undefined) return 'CannotUnpath';
        }
        return current;
    }

    function formatFunctionString(src) {
        var quotation = /("([^"]|"")*"|'([^']|'')*'|`([^`]|``)*`)/g;
        var strlist = [];
        var result;
        var finished = 0;
        while ((result = quotation.exec(src))) {
            var start = result.index,
                end = quotation.lastIndex;
            strlist.push({
                type: "outer",
                value: src.slice(finished, start)
            });
            strlist.push({
                type: "inner",
                value: src.slice(start, end)
            });
            finished = end;
        }
        strlist.push({
            type: "outer",
            value: src.slice(finished, src.length)
        });
        return strlist.map(x => {
            switch (x.type) {
                case "inner":
                    return x.value;
                case "outer":
                    return x.value;
            }
        }).join("");
    }

    function isNativeFunction(func) {
        if (func instanceof Function) {
            var regex = /function\s+([^(){}[\]]*)\([^(){}]*\)\s*\{\s*\[(native code|Command Line API)\]\s*\}/g;
            var result = regex.exec(func.toString());
            return !!result && (result[1] === '' ? true : result[1]);
        }
    }

    function isBoundFunction(fn) {
        if (fn instanceof Function) {
            var regex = /^bound (.*)/i,
                result = regex.exec(fn.name);
            return !!result && (result[1] === '' ? '(anonymous)' : result[1]);
        } else {
            throw new TypeError('fn is not a function.');
        }
    }

    function isAsyncFunction(fn) {
        if (fn instanceof Function) {
            return fn.constructor.name === 'AsyncFunction';
        } else {
            throw new TypeError('fn is not a function.');
        }
    }

    function isGeneratorFunction(fn) {
        if (fn instanceof Function) {
            return fn.constructor.name === 'GeneratorFunction';
        } else {
            throw new TypeError('fn is not a function.');
        }
    }


    function stringify(any, source_embedding = false) {
        return JSON.stringify(clone(any, true, false, [], source_embedding));
    }

    function parse(str) {
        return reverse(JSON.parse(str));
    }

    function isBuiltInObject(obj) {
        if (!(obj instanceof Object)) return false;
        var regex = /^\[object ([^\]]+)\]$/ig,
            result = regex.exec(obj.toString()),
            exclude = ['Object', 'Arguments'];
        return !!result && !exclude.includes(result[1]) && result[1];
    }

    function setGlobal() {
        AsyncGeneratorFunction = Object.getPrototypeOf(async function* () {});
        GeneratorFunction = Object.getPrototypeOf(function* () {});
        Generator = Object.getPrototypeOf(function* () {}).prototype;
        Clone.GLOBAL_TREE = clone(GLOBAL, false, true, Clone.GLOBAL_EXCLUDE);
    }

    function addToGlobal(tree, name = tree.name) {
        GLOBAL[name] = reverse(tree);
    }
    //todo 引数、body 解析してnormarize
    function classifyFunction(fn, option = {
        name: ''
    }) {
        var result = {
            isGenerator: false,
            isAsync: false,
            isArrow: false,
            isClass: false,
            isInnerClass: false,
            isNative: undefined,
            name: '',
            description: '',
            source: '',
        }
        if (typeof fn === 'string') {
            var src = fn;
        } else if (fn instanceof Function) {
            var src = fn.toString();
            result.isNative = !!isNativeFunction(fn);
        }
        var i = 0;
        do {
            //アロー関数
            var re = /^(async)?\s*\(/,
                m = re.exec(src);
            if (m) {
                if (m[1] === 'async') result.isAsync = true;
                result.isArrow = true;
                result.name = option.name || '';
                break;
            }

            //ジェネレータ
            var re = /^(async\s+)?function\s*\*\s*([^(]*)/,
                m = re.exec(src);
            if (m) {
                result.isGenerator = true;
                m[1] = m[1] || '';
                if (m[1].trim() === 'async') result.isAsync = true;
                result.name = option.name || m[2];
                src = src.replace(re, `$1function * ${result.name}`);
                break;
            }

            //通常function
            var re = /^(async\s*)?function(\s+[^(]+|\s*)/,
                m = re.exec(src);
            if (m) {
                m[1] = m[1] || '';
                if (m[1].trim() === 'async') result.isAsync = true;
                result.name = option.name || m[2].trim();
                src = src.replace(re, `$1function ${result.name}`);
                break;
            }

            //class
            var re = /^class\s+([^{]+)/,
                m = re.exec(src);
            if (m) {
                result.isClass = true;
                result.name = option.name || m[1];
                src = src.replace(re, `class ${result.name}`);
                break;
            }

            //inner class
            result.isInnerClass = true;
            src = 'function ' + src;
            i++;
        } while (i <= 1);
        result.description = `${result.isInnerClass?'InnerClass ':''}${result.isNative?'Native':''}${result.isAsync?'Async ':''}${result.isGenerator?'Generator':''}${result.isArrow?'Arrow':''}${result.isClass?'Class':''}Function ${result.name?result.name:'(anonymous)'}`
        result.source = src;
        return result;
    }

    function deepcopy(any) {
        return reverse(clone(any));
    }

    Clone.deepcopy = deepcopy;
    Clone.classifyFunction = classifyFunction;
    Clone.setGlobal = setGlobal;
    Clone.addToGlobal = addToGlobal;
    Clone.path = path;
    Clone.unpath = unpath;
    Clone.clone = clone;
    Clone.reverse = reverse;
    Clone.stringify = stringify;
    Clone.parse = parse;
    Clone.search = search;
    Clone.searchFirst = searchFirst;
    Clone.searchById = searchById;
    Clone.isPrimitive = isPrimitive;
    Clone.isBuiltInObject = isBuiltInObject;
    Clone.isNativeFunction = isNativeFunction;
    Clone.isAsyncFunction = isAsyncFunction;
    Clone.isBoundFunction = isBoundFunction;
    Clone.isGeneratorFunction = isGeneratorFunction;
    Clone.formatFunctionString = formatFunctionString;
    Clone.CLONE_RESULTS = CLONE_RESULTS;
    Clone.GLOBAL_TREE = null;
    Clone.GLOBAL_EXCLUDE = [];
    return Clone;
})();