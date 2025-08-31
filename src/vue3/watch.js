import Dep from './dep.js';

/**
 * 订阅者：监听变化
 */
export default class Watcher {
    constructor(effect) {
        // 当下激活的副作用
        this.effect = effect;
        this.run();
    }

    // 执行副作用
    run() {
        // 保存当前的订阅者
        Dep.activeEffect = this;

        // 运行副作用
        this.effect();

        Dep.activeEffect = null;
    }

    update() {
        this.run();
    }
}

export function effect(effect) {
    new Watcher(effect);
}
