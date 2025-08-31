import Dep from '../dep/index.js';
import { def, isValidArrayIndex } from '../util/index.js';
import { arrayMethods } from './array.js';

/**
 * @description 为引用类型创建数据劫持，并返回一个 Observer 实例
 */
export function observe(obj) {
    // 终止条件：非对象、null 或已被劫持

    // 返回 __ob__ 是给数组准备的。这样，当对象在对每个属性进行劫持时，里面的数组，就能通过自身的 __ob__.dep 收集自己，详见 52 → 55 行
    if (
        obj &&
        Object.prototype.hasOwnProperty.call(obj, '__obj__') &&
        obj.__ob__ instanceof Observer
    ) {
        return obj.__ob__;
    }

    if (typeof obj !== 'object' || obj === null) {
        return;
    }

    return new Observer(obj);
}

/**
 * @description 通过 Object.defineProperty 为对象数据进行属性劫持
 */
export function defineReactive(obj, key, val) {
    // 依赖收集容器
    const dep = new Dep();

    let childOb;
    // 递归处理嵌套对象
    if (typeof val === 'object' && val !== null) {
        childOb = observe(val);
    }

    Object.defineProperty(obj, key, {
        enumerable: true, // 保证属性可枚举
        configurable: true, // 允许后续属性修改
        get() {
            console.log('正在访问属性：', key, '，值为：', val);

            // 依赖收集：这里被触发，说明有观察者正在访问数据，应使用 dep 收集 watcher
            // dep 成了闭包
            // ? 但是，是哪个 watcher 正在访问数据？这个 watcher 需要在 Watcher 中提前暂存
            if (Dep.target) {
                dep.depend();

                // 当访问该对象的数组属性时，通过数组自身的 __ob__.dep 收集对数组整体的依赖
                if (childOb) {
                    childOb.dep.depend();
                }
            }
            return val;
        },
        set(newVal) {
            if (newVal === val) return; // 避免无意义更新

            // 派发更新：这里被触发，说明正在修改数据，应使用 dep 通知所有依赖
            console.log('正在修改属性：', key, '，新值为：', newVal);
            val = newVal;
            childOb = observe(newVal); // 如果新的值是一个引用类型的数据，记得也要递归劫持，并更新到 childOb
            dep.notify();
        },
    });
}

/**
 * @description 将普通数据转化为响应式数据
 * 作用：
 * 1. 负责劫持数据属性，创建 Dep 实例。
 * 2. 递归遍历对象属性，调用 defineReactive 创建 getter 和 setter
 * 3. 数组的响应式通过重写原型方法实现。
 */
export default class Observer {
    constructor(obj) {
        // 把 Observer 实例添加到引用类型的 value 的 __ob__ 属性上，有以下作用：
        // 1. 建立数据与 Observer 实例的关联
        // 2. 作为 Observer 实例的引用，提供 dep（依赖收集器）、vmCount（引用计数）等核心属性，支撑依赖追踪与数据更新通知机制
        // 3. 不可枚举特性（enumerable: false）避免干扰 for...in 等遍历逻辑
        def(obj, '__ob__', this);
        this.value = obj;

        // 为什么要在这里再添加一个添加 dep？
        // 这个 dep 收集器就会跟随 __ob__ 一并添加到引用类型的数据上
        // 这个 dep 对数组来说很有用，因为数组的响应式处理不走 defineProperty（走 observeArray），没有对应的订阅发布器去派发更新
        // 这样的话，在数组的响应式处理中，就可以通过 __ob__.dep 派发通知
        this.dep = new Dep();

        if (Array.isArray(obj)) {
            // 数组的响应式处理
            this.value.__proto__ = arrayMethods; // 通过数组原型链，修改数组方法
            this.observeArray();
        } else {
            // 对象的响应式处理
            this.walk();
        }
    }

    // 递归定义对象的响应式属性
    walk() {
        const keys = Object.keys(this.value);
        for (let i = 0; i < keys.length; i++) {
            defineReactive(this.value, keys[i], this.value[keys[i]]);
        }
    }

    // 递归观测数组元素
    observeArray() {
        for (let i = 0, l = this.value.length; i < l; i++) {
            observe(this.value[i]);
        }
    }
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target, key, val) {
    const ob = target.__ob__;

    // 原有响应式数组
    // 使用 splice 将新值并入数组
    if (isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key);
        target.splice(key, 1, val); // 因为 target 的方法已经被重写，所以此时已经有了响应式
        return val;
    }

    // 原有响应式对象
    // 该属性原来已存在于对象中，则直接更新
    if (key in target && !(key in Object.prototype)) {
        target[key] = val;
        return val;
    }

    // 非响应式的数据
    // 需要进行响应式处理
    if (!ob) {
        target[key] = val;
        return val;
    }
    defineReactive(ob.value, key, val);
    ob.dep.notify();

    return val;
}
