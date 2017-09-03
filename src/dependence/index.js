class Dep {
    static target = null;
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

export default Dep;