import Dep from '../dependence';

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

function observe (obj, dep) {
    if (Array.isArray(obj) && dep) {
        obj.__dep__ = dep;
        obj.__proto__ = reactiveArrayProto;
        obj.forEach(item => observe(item, dep));
    } else if (typeof obj === 'object') {
        for (let prop in obj) {
            defineReactive(obj, prop, obj[prop]);
        }
    }
}

function defineReactive (obj, key, val) {
    // 每一项变量都有自己的被依赖列表，当值有变化时通知它们
    const dep = new Dep();
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
            observe(newVal, dep);
            dep.notify();
        }
    });
    observe(val, dep);
}

// 监视数据变动
class Observer {
    constructor (data) {
        if (!data) return;
        observe(data);
    }
}

export default Observer;