/**
 * 副作用管理模块
 * Vue 2 的 Watcher 作为通用的"观察者"，在 Vue 3 中被拆解为 ReactiveEffect/ComputedRef/WatchAPI
 */

// 当前激活的effect
export let activeEffect = null;

// 简化的ReactiveEffect类
class ReactiveEffect {
    constructor(fn) {
        // 副作用函数
        this.fn = fn;

        // 类型：Dep[]，存储所有包含该 effect 的 Dep 依赖集合
        // effect 重新执行时，可以用来清理无效依赖
        this.deps = [];
    }

    // 执行副作用函数并收集依赖
    run() {
        activeEffect = this;
        const result = this.fn();
        activeEffect = null;
        return result;
    }

    // 更新时执行
    update() {
        this.run();
    }
}

/**
 * @description 将用户定义的副作用包装成可追踪的结构，因为函数中可能会用到响应式数据，需要侦听，一旦变化，立即触发更新
 * @param {Function} fn 用户定义的副作用函数
 */
export function effect(fn) {
    const _effect = new ReactiveEffect(fn);
    _effect.run();
    return _effect;
}
