/**
 * スレッドプール実装、
 */

if (typeof Clone === 'undefined') console.warn('[非推奨] "clone.js"がロードされていません。stringifer/parserにはJSONを使用します。');

var Thread = Thread || (function ThreadImplimentation() {
    (0, eval)('this').ThreadImplimentation = ThreadImplimentation;
    const Thread = function (fn, g = {}, scripts = [], base = '') {
        const invoke = __invoke__.toString().replace('__invoke__', 'invoke');
        const clone_source = typeof CloneImplimentation !== 'undefined' ? `const Clone=(${CloneImplimentation.toString()})();` : '';
        const blob = new Blob([`
importScripts(${scripts.map(x=>'"'+Ajax.getAbsolutePath(base,x)+'"').join(',')});
const invoke=${invoke};
${Ajax.toString()}
${clone_source}
const Thread=(${ThreadImplimentation.toString()})();
var g=Thread.parse('${Thread.stringify(g,true)}');
const main=(${fn.toString()});
const initonmessage=async function(msg){
    var msg_obj=Thread.parse(msg.data);
    for (const key in g) (0,eval)(key+'=g.'+key);
    
    if(msg_obj.fn){
        var decreation = '';
        for (const key in msg_obj.g) decreation += 'var '+key+' = msg_obj.g.'+key+';';
        var result = await eval('\
            (async function(__args__){\
                '+decreation+'\
                return await ('+msg_obj.fn+').bind(this,...__args__)();\
            })').bind(msg_obj['this'], msg_obj.args)();
    }else{
        var result=await main.bind(msg_obj['this'],...msg_obj.args)();
    }

    switch(msg_obj.type){
        case 'start':
            self.postMessage({type:'end',data:result});
            break;
        case 'execute':
            self.postMessage({type:'suspend',data:result});
            self.onmessage=initonmessage;
            break;
    }
};
self.onmessage=initonmessage;
        `], {
            type: "text/javascript"
        });
        this.url = URL.createObjectURL(blob);
        this.worker = new Worker(this.url);
        this.state = 'suspend';
    };



    //prototype methods
    function start(...args) {
        return this._wakethread(args, 'start');
    }

    function execute(...args) {
        return this._wakethread(args, 'execute');
    }

    function push(fn, g) {
        return this._wakethread([], 'execute', fn, g);
    }

    function bind(...args) {
        this.args = args;
        return this;
    }

    function _wakethread(args = [], type, fn, g) {
        this.state = 'running'
        return new Promise((res, rej) => {
            this.worker.onmessage = __msg__ => {
                this.__worker_onmessage__(__msg__, res, rej);
            };
            this.worker.onerror = rej;
            this.worker.postMessage(Thread.stringify({
                'this': null, //this,
                args,
                type,
                fn:fn?fn.toString():null,
                g
            }));
        });
    }

    function __worker_onmessage__(__msg__, res, rej) {
        switch (__msg__.data.type) {
            case 'end':
                this.terminate();
                this.state = 'end';
                res(__msg__.data.data);
                break;
            case 'suspend':
                this.state = 'suspend';
                res(__msg__.data.data);
                break;
            default:
                var __args__ = Thread.parse(__msg__.data.args);
                var decreation = '';
                for (const key in __args__) decreation += `var ${key} = __args__.${key};`;
                var __result__ = eval(`
                    (function(__args__){
                        ${decreation}
                        return (${__msg__.data.data}).bind(this)();
                    })`).bind(this, __args__)();
                this.worker.postMessage({
                    type: 'result',
                    data: __result__
                });
                break;
        }
    }

    function terminate() {
        this.worker.terminate();
        window.URL.revokeObjectURL(this.url);
        this.state = 'end';
    }

    //static method
    function __invoke__(fn, args = {}) {
        return new Promise((res, rej) => {
            self.postMessage({
                type: 'invoke',
                data: fn.toString(),
                args: Thread.stringify(args),
            });
            self.onmessage = function (msg) {
                res(msg.data.data);
            };
            self.onerror = function (error) {
                rej();
            }
        });
    }

    function __reviver__(key, value) {
        if (value && value.toString().indexOf('__FUNCTION__:') === 0) {
            value = value.replace('__FUNCTION__:', '');
            return eval(`(${value})`);
        } else {
            return value;
        }
    }

    function __replacer__(key, value) {
        if (value instanceof Function) {
            return '__FUNCTION__:' + value.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n');
        } else if (value instanceof Date) {
            return value.toISOString();
        } else {
            return value;
        }
    }

    function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function any(threads, method = 'start') {
        return Promise.race(threads.map(x => {
            return x.args ? x[method](...x.args) : x[method]();
        }));
    }

    function all(threads, method = 'start') {
        return Promise.all(threads.map(x => {
            return x.args ? x[method](...x.args) : x[method]();
        }));
    }

    function create(num, fn, g, scripts) {
        return Array.from({
            length: num
        }, () => new Thread(fn, g, scripts));
    }

    function stringify(any, source_embedding = false) {
        if (typeof Clone !== 'undefined') {
            return Clone.stringify(any, source_embedding)
        } else {
            return JSON.stringify(any, __replacer__);
        }
    }

    function parse(src) {
        if (typeof Clone !== 'undefined') {
            return Clone.parse(src);
        } else {
            return JSON.parse(src, __reviver__);
        }
    }

    Array.prototype.parallel = async function (fn, g, scripts) {
        await forEach(this, fn, g, scripts);
    }

    async function forEach(array, fn, g, scripts) {
        return await all(array.map(x => {
            return new Thread(fn, g, scripts).bind(x);
        }), 'start');
    }

    var prototype = {
        start,
        execute,
        bind,
        _wakethread,
        __worker_onmessage__,
        terminate,
        push,
    }

    var statics = {
        wait,
        any,
        all,
        create,
        stringify,
        parse,
        __replacer__,
        __reviver__,
        __invoke__,
        forEach,
    }

    Object.assign(Thread, statics);
    Object.assign(Thread.prototype, prototype);


    return Thread;
})();

var ThreadPool = ThreadPool || (function ThreadPoolImplimentation() {
    (0, eval)('this').ThreadPoolImplimentation = ThreadPoolImplimentation;
    const ThreadPool = function (count, g = {}, scripts = []) {
        this.count = count;
        this.threads = Thread.create(count, () => {}, g, scripts);
        this.pool = [];
    }

    function execute() {
        if (this.pool.length) {
            for (let i = 0; i < this.count; i++) {
                const e = this.threads[i];
                if (e.state === 'suspend') {
                    e.push(this.pool[0].fn, this.pool[0].g).then(() => {
                        this.execute();
                    });
                    this.pool.shift();
                    break;
                }
            }
        }
    }

    function push(fn, g) {
        this.pool.push({
            fn,
            g
        });
        this.execute();
    }

    function finish(){
        this.threads.forEach(e=>{
            e.terminate();
        });
    }

    var prototype = {
        execute,
        push,
        finish
    }

    var statics = {

    }

    Object.assign(ThreadPool, statics);
    Object.assign(ThreadPool.prototype, prototype);

    return ThreadPool;
})();

class Ajax {
    static request(options = {
        type: 'get',
        url: '',
        contentType: null,
        data: null,
        dataType: '',
        base: '',
    }) {
        let settings = {
            type: 'get',
            url: '',
            contentType: null,
            data: null,
            dataType: '',
            base: '',
        };
        for (const key in options)
            if (options.hasOwnProperty(key)) settings[key] = options[key];
        return new Promise((res, rej) => {
            var req = new XMLHttpRequest();
            req.open(settings.type, Ajax.getAbsolutePath(settings.base, settings.url), true);
            if (settings.contentType) req.setRequestHeader('Content-Type', Ajax.getContentType(
                settings.contentType));
            req.send(settings.data);
            req.onload = function () {
                var response;
                if (settings.dataType.toLowerCase() === 'json') {
                    response = JSON.parse(this.response);
                } else {
                    response = this.response;
                }
                res(response);
            };
            req.onerror = function () {
                rej(this.status);
            }
        });
    }
    static getContentType(text) {
        for (let i = 0, length = Ajax.contentTypes.length; i < length; i++) {
            if (Ajax.contentTypes[i].alias === text) {
                return Ajax.contentTypes[i].type;
            }
        }
        return text;
    }
    static getJson(url) {
        return Ajax.request({
            type: 'get',
            url,
            dataType: 'json',
        });
    }
    static get(url) {
        return Ajax.request({
            type: 'get',
            url,
        });
    }
    /**
     * @summary convert relative path to absolute path.
     * 
     * @static
     * @param {string} base directory needs to ends with '/'
     * @param {string} relative
     * @param {boolean} [withorigin=true]
     * @returns {string} absolute path
     * @memberof Ajax
     */
    static getAbsolutePath(base, relative, withorigin = true) {
        var origin = location.origin,
            path = base.startsWith(origin) ? base.replace(origin, '') : base,
            path = path.startsWith('/') ? path.replace('/', '') : path,
            stack = path.split('/'),
            relative = relative.startsWith(origin) ? relative.replace(origin, '') : relative,
            relative = relative.startsWith('/') ? relative.replace('/', '') : relative,
            rel = relative.split('/');
        if (withorigin) stack.unshift(origin);
        stack.pop();
        for (let i = 0, len = rel.length; i < len; i++) {
            const e = rel[i];
            switch (e) {
                case '.':
                    continue;
                case '..':
                    stack.pop();
                    break;
                default:
                    stack.push(e);
                    break;
            }
        }
        return stack.join('/');
    }
}
Ajax.contentTypes = [{
    alias: 'javascript',
    type: 'text/javascript'
}, {
    alias: 'text',
    type: 'text/plain'
}, {
    alias: 'csv',
    type: 'text/csv'
}, {
    alias: 'html',
    type: 'text/html'
}, {
    alias: 'css',
    type: 'text/css'
}, {
    alias: 'json',
    type: 'application/json'
}, {
    alias: 'form',
    type: 'application/x-www-form-urlencoded'
}, ];
