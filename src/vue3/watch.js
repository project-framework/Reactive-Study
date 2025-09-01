import Dep from './dep.js';

/**
 * 订阅者：监听变化
 */
export default class Watcher {
    constructor(effect) {
        this.effect = effect;
        Dep.activeEffect = this;
        this.run(); // 当下激活的副作用
        Dep.activeEffect = null;
    }

    // 执行副作用
    run() {
        this.effect();
    }
}

export function effect(effect) {
    new Watcher(effect);
}
