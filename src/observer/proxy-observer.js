import Dep from '../dependence';

function proxyObserver (obj) {
    const cacheMap = Object.create(null);
    return new Proxy(obj, {
        has (key) {
            return true;
        },
        get (target, key) {
            // return target[key];
            if (key in cacheMap) {
                Dep.target && cacheMap[key].dep.addSub(Dep.target);
                return cacheMap[key].value;
            }
            const rawValue = target[key];
            let value;
            if (rawValue && typeof rawValue === 'object') {
                value = proxyObserver(rawValue);
            } else {
                // todo: native array methods
                value = rawValue;
            }
            let dep = new Dep();
            Dep.target && dep.addSub(Dep.target);
            cacheMap[key] = {
                value,
                dep,
            };
            return value;
        },
        set (target, key, rawValue) {
            // target[key] = rawValue;
            // return true;
            if (target[key] === rawValue) return;
            target[key] = rawValue;
            let value;
            if (rawValue && typeof rawValue === 'object') {
                value = proxyObserver(target[key]);
            } else {
                value = rawValue;
            }
            if (!cacheMap[key]) {
                cacheMap[key] = {
                    value,
                    dep: new Dep(),
                };
            } else {
                cacheMap[key].value = value;
                cacheMap[key].dep.notify();
            }
            return true;
        },
    });
}

export default proxyObserver;