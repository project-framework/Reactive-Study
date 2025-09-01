/**
 * 依赖管理模块
 */
export default class Dep {
    constructor() {
        // 存放 watcher 实例
        // Set 是一个高效地管理不重复的数据集合，比数组好用
        this.subscribers = new Set();
    }

    // 添加订阅者
    addSub(sub) {
        if (sub && sub.update) {
            this.subscribers.add(sub);
        }
    }

    // 移除订阅者
    removeSub(sub) {
        this.subscribers.delete(sub);
    }

    // 通知所有订阅者
    notify() {
        this.subscribers.forEach(sub => {
            sub.update();
        });
    }
}

// 创建 Dep 实例的工具函数
export function createDep() {
    return new Dep();
}
