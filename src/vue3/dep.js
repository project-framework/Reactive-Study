/**
 * 发布者：依赖收集
 */
export default class Dep {
    constructor() {
        // 存放 watcher 实例
        // Set 是一个高效地管理不重复的数据集合，比数组好用
        this.subs = new Set();
    }

    // 添加 wathcer
    depend() {
        if (Dep.activeEffect) {
            this.subs.add(Dep.activeEffect);
        }
    }

    // 触发依赖的更新
    notify() {
        this.subs.forEach(watcher => watcher.run());
    }
}

/**
 * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap}
 * @description WeakMap 作为顶层存储，键为原始对象，值为 Map 对象（存储该对象的所有依赖）
 * WeakMap 是一种键值对的集合，它的键必须是对象或者 Symbol()，值可以是任意类型且不会创建对键的强引用
 * 强引用：阻止对象被垃圾回收的普通引用方式。只要存在强引用，对象就不会被回收。
 * 弱引用：不会阻止垃圾回收机制回收对象。当对象失去所有强引用后，即使存在弱引用，垃圾回收器也会回收该对象。
 * 通过 WeakMap ，可以将数据与一个对象关联
 */
export const targetMap = new WeakMap();

/**
 * @description 创建依赖
 * @param {object} rawObject 原始对象
 * @param {string} key 原始对象的属性名
 * @returns {Dep} 返回某个响应式属性的 Dep 依赖
 */
function createDep(rawObject, key) {
    let depsMap = targetMap.get(rawObject);

    // 1. 给当前对象创建一个 Map 映射，存储该对象的所有依赖
    // 为什么要初始化一个 map 呢？因为需要为对象的每一个属性创建一个依赖收集器
    // Map 的键名就是响应式对象的属性名，值就是该属性对应的所有副作用函数（用 Set 收集）
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(rawObject, depsMap);
    }

    // 2. 获取/初始化属性对应的 Dep 依赖（Dep 实例里面存着属性的所有副作用）
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Dep();
        depsMap.set(key, dep);
    }

    // 3. 通过对象（WeakMap） → 对象的属性（Map） → 属性对应的依赖（Set）
    // 最终找到对象的某个属性的所有依赖
    return dep;
}

/**
 * @description 追踪依赖
 * @param {object} rawObject 原始对象
 * @param {string} key 原始对象的属性名
 */
export function track(target, key) {
    const dep = createDep(target, key);
    dep.depend();
}

/**
 * @description 触发依赖
 * @param {object} rawObject 原始对象
 * @param {string} key 原始对象的属性名

 */
export function trigger(target, key) {
    const dep = createDep(target, key);
    dep.notify();
}
