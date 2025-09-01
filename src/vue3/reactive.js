import Dep, { createDep } from './dep.js';
import { activeEffect } from './effect.js';

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
 * @description 收集依赖
 * @param {object} target 原始对象
 * @param {string} key 原始对象的属性名
 */
export function track(target, key) {
    if (!activeEffect) return;

    // 1. 获取目标对象的依赖 Map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 初始化 Map
        // 使用 Map 为对象的每一个属性创建一个依赖收集器，值就是该属性对应的所有副作用函数（用 Set 收集）
        targetMap.set(target, (depsMap = new Map()));
    }

    // 2. 再获取 Map 中对象属性的依赖 Dep
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = createDep()));
    }

    // 3. 在 trackEffects 函数中将依赖dep 与副作用 effect 建立双向连接
    trackEffects(dep);
}

/**
 * @description dep 与 effect 建立双向连接
 * @param {Dep} dep
 */
function trackEffects(dep) {
    // 如果当前 effect 尚未加入此依赖集合
    if (!dep.subscribers.has(activeEffect)) {
        dep.addSub(activeEffect); // 将 effect 添加到 dep
        activeEffect.deps.push(dep); // 将 dep 添加到 effect 的 deps 数组中
    }
}

/**
 * @description 触发更新
 * @param {object} target 原始对象
 * @param {string} key 原始对象的属性名
 */
export function trigger(target, key) {
    // 1. 获取目标对象的依赖Map
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    // 2. 再从 Map 中获取属性的依赖Dep
    const dep = depsMap.get(key);
    if (dep) {
        dep.notify(); // 通知所有订阅者
    }
}

// 创建响应式对象
export function reactive(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            // 收集依赖
            track(target, key);
            return res;
        },
        set(target, key, value, receiver) {
            const res = Reflect.set(target, key, value, receiver);
            // 触发更新
            trigger(target, key);
            return res;
        },
    });
}
