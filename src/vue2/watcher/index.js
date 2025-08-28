import Dep from '../dep/index.js';

/**
 * @description 承担着数据变化监听与更新触发的关键角色
 */
export default class Watcher {
    constructor(data, key) {
        this.value = data;
        this.key = key;

        // 调用 get 方法访问 value，这样才能触发 defineProperty 的 getter，进行数据劫持
        // 将当前正在访问数据的 watcher 暂存到 Dep 的静态属性中，确保依赖关系的准确
        Dep.target = this;
        this.get();
        Dep.target = null;
    }
    get() {
        return this.value[this.key];
    }
    // 观察者的响应操作，在数据更改时调用该方法进行更新
    update() {
        console.log(`watcher 监听到${this.key}的变更，可以开始执行更新操作`);
    }
}
