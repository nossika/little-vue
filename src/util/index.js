// 字面量表达式转化为函数
export const expToFunc = function expToFunc (exp, scope) {
    return new Function('with(this){return ' + exp + '}').bind(scope);
};

// 异步任务队列，所有改变dom的操作推入这个队列，等待所有同步操作完成后再操作dom，减少操作dom的次数
export const nextTick = (() => {
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