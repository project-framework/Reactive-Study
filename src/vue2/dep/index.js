/**
 * @description 管理依赖（Watcher），实现依赖收集与派发更新。
 * 每个响应式属性都有一个 Dep 实例，它被定义在 defineReactive() 中，并在 getter 和 setter 中调用（形成了闭包）
 * 在 getter 中调用 depend() 收集当前 Watcher
 * 在 setter 中调用 notify() 触发依赖更新
 * Dep.target 临时存储依赖收集阶段正在执行的 Watcher 实例，确保依赖关系的准确建立
 */
export default class Dep {
    constructor() {
        this.subs = []; // 存储依赖（Watcher）
    }

    // 添加依赖
    depend() {
        // Dep.target 是当前正在执行的 watcher
        if (Dep.target) {
            this.subs.push(Dep.target);
        }
    }

    // 通知依赖
    notify() {
        const subs = this.subs.slice(); // 拷贝依赖列表
        subs.forEach(watcher => watcher.update()); // 触发依赖的更新
    }
}
