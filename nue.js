((global, factory) => {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory()
        : typeof define === 'function' && define.amd
        ? define(factory)
        : (global.Nue = factory());
})(this, () => {
// 字面量表达式转化为函数
const expToFunc = function expToFunc (exp, scope) {
    return new Function('return ' + exp).bind(scope);
};

// 异步任务队列，所有改变dom的操作推入这个队列，等待所有同步操作完成后再操作dom，减少操作dom的次数
const nextTick = (() => {
    let p = Promise.resolve();
    let queue = [];
    let pending = false;
    let exec = () => {
        pending = false;
        // 先清空队列再执行里面的函数，即使执行出错也能保证队列干净
        let spliced = queue.splice(0, queue.length);
        spliced.forEach(fn => fn());
    };
    return fn => {
        queue.push(fn);
        if (!pending) {
            pending = true;
            p.then(exec);
        }
    }
})();

// 变量的被依赖列表
class Dep {
    constructor () {
        this.subs = new Set();
    }
    addSub (sub) {
        this.subs.add(sub);
    }
    removeSub (sub) {
        this.subs.delete(sub);
    }
    notify () {
        for (let sub of this.subs) {
            sub.update();
        }
    }
}
// 目标watcher实例
Dep.target = null;

// 构造新Array原型使其能够监听数组变动
const reactiveArrayProto = (() => {
    let arrayProto = Object.create(Array.prototype);
    [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice',
        'sort',
        'reverse'
    ].forEach(method => {
        let oriFn = arrayProto[method];
        Object.defineProperty(arrayProto, method, {
            configurable: true,
            value () {
                let args = [].slice.call(arguments);
                let ret = oriFn.call(this, ...args);
                let dep = this.__dep__;

                let inserted;
                switch (method) {
                    case 'push':
                        inserted = args.slice();
                        break;
                    case 'unshift':
                        inserted = args.slice();
                        break;
                    case 'splice':
                        inserted = args.slice(2);
                        break;
                }
                // 对新增数据进行监听
                if (inserted && inserted.length) inserted.forEach(data => {new Observer(data, dep)});
                dep && dep.notify();
                return ret;
            }
        });
    });
    return arrayProto;
})();

// 监视数据变动
class Observer {
    constructor (data) {
        if (!data) return;
        this.observe(data);
    }
    observe (obj, dep) {
        if (Array.isArray(obj) && dep) {
            obj.__dep__ = dep;
            obj.__proto__ = reactiveArrayProto;
            obj.forEach(item => this.observe(item, dep));
        } else if (typeof obj === 'object') {
            for (let prop in obj) {
                this.defineReactive(obj, prop, obj[prop]);
            }
        }
    }
    defineReactive (obj, key, val) {
        // 每一项变量都有自己的被依赖列表，当值有变化时通知它们
        const dep = new Dep();
        const self = this;
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get () {
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            set (newVal) {
                if (newVal === val) return;
                val = newVal;
                self.observe(newVal, dep);
                dep.notify();
            }
        });
        self.observe(val, dep);
    }
}

// 实现表达式、依赖、回调三者的绑定
// 当依赖改变时，由observer触发其dep的notify，即调用dep列表中各watcher的update，从而重新计算表达式的值并调用绑定的回调函数更新dom
class Watcher {
    constructor (exp, scope, callback) {
        this.value = null;
        this.exp = exp;
        this.scope = scope;
        this.callback = callback;
        this.update();
    }
    get () {
        Dep.target = this;
        // 这一步间接调用了exp中所有依赖的get方法，自动把此watcher实例添加到依赖的dep列表
        let value = expToFunc(this.exp, this.scope)();
        Dep.target = null;
        return value;
    }
    update () {
        let newVal = this.get();
        if (this.value !== newVal) {
            this.value = newVal;
            this.callback && this.callback(newVal);
        }
    }
}

// 编译dom，将dom中的表达式片段用watcher绑定
class Compiler {
    constructor (el, scope) {
        this.$scope = scope;
        this.walkChildren(el, this.$scope);
    }
    walkChildren (el, scope) {
        [].slice.call(el.childNodes).forEach(node => {
            if (node.nodeType === 3) {
                this.compileText(node, scope);
            } else if (node.nodeType === 1) {
                this.walkAttributes(node, scope);
                this.walkChildren(node, scope);
            }
        });
    }
    walkAttributes (node, scope) {
        [].slice.call(node.attributes).forEach(attrNode => {
            let attr = this.getAttrInfo(attrNode);
            this.compileAttribute(attr.type, {
                scope,
                name: attr.name,
                exp: attr.value,
                node
            });
            node.removeAttribute(attrNode.name);
        });
    }
    compileText (node, scope) {
        let exp = this.textToExp(node.textContent);
        new Watcher(exp, scope, newVal => {
            nextTick(() => {
                node.textContent = newVal
            });
        });
    }
    compileAttribute (type, params) {
        let { exp, name, node, scope } = params;
        switch (type) {
            case 'on':
            {
                let callback = null;
                if (typeof this.$scope[exp] === 'function') {
                    callback = this.$scope[exp].bind(this.$scope);
                } else {
                    callback = expToFunc(exp, scope);
                }
                node.addEventListener(name, callback);
                break;
            }
            case 'bind':
            {
                new Watcher(exp, scope, newVal => {
                    nextTick(() => {
                        node.setAttribute(name, newVal);
                    });
                });
                break;
            }
            case 'show':
            {
                new Watcher(exp, scope, newVal => {
                    node.style.display = newVal ? 'block' : 'none';
                });
                break;
            }
            case 'if':
            {
                let placeholder = document.createTextNode('');
                node.parentNode.insertBefore(placeholder, node);
                node.parentNode.removeChild(node);
                new Watcher(exp, scope, newVal => {
                    nextTick(() => {
                        if (newVal && !node.parentNode) {
                            placeholder.parentNode.insertBefore(node, placeholder);
                        } else if (!newVal && node.parentNode) {
                            node.parentNode.removeChild(node);
                        }
                    });
                });
                break;
            }
        }
    }
    getAttrInfo (attrNode) {
        let [name, value, type] = [attrNode.name, attrNode.value];

        if (name.match(/^n-/)) {
            [type, name] = name.slice(2).split(':');
        } else if (name.match(/^:/)) {
            type = 'bind';
            name = name.slice(1);
        } else if (name.match(/^@/)) {
            type = 'on';
            name = name.slice(1);
        }
        return { name, value, type };
    }
    textToExp (text) {
        let [regMatch, regReplace] = [/\{\{(.+?)}}/g, /\{\{|}}/g];
        let pieces = text.split(regMatch);
        let expMatches = (text.match(regMatch) || []).map(match => match.replace(regReplace, ''));
        let arr = [];
        pieces.forEach(piece => {
            if (!expMatches.includes(piece)) piece = '`' + piece + '`';
            arr.push(piece);
        });
        return arr.join('+');
    }
}

// Nue实例，用observer监听data，用compile编译el，compile过程中调用watcher实现el与data的绑定
class Nue {
    constructor (options) {
        this.$options = options;
        new Observer(options.data);
        this._proxy(options);
        this.$el = typeof options.el === 'string'
            ? document.querySelector(options.el)
            : options.el;
        if (!(this.$el instanceof HTMLElement)) {
            this.$el = document.body;
        }
        if (options.template) {
            this.$el.innerHTML = options.template;
        }
        new Compiler(this.$el, this);
    }
    // 将options中的data、computed、methods挂载到Nue实例上
    _proxy (options) {
        for (let prop in options.data) {
            Reflect.defineProperty(this, prop, {
                enumerable: true,
                configurable: true,
                get () {
                    return this.$options.data[prop];
                },
                set (newVal) {
                    this.$options.data[prop] = newVal;
                }
            })
        }
        for (let prop in options.computed) {
            Reflect.defineProperty(this, prop, {
                enumerable: true,
                configurable: true,
                get () {
                    return this.$options.computed[prop].call(this);
                },
                set (newVal) {

                }
            })
        }
        Object.assign(this, options.methods);
    }
    $nextTick (fn) {
        nextTick(fn.bind(this));
    }
}

return Nue;

});

