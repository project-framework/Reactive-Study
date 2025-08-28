import Dep from '../dep/index.js';

/**
 * @description 创建并返回一个 Observer 实例
 */
export function observe(value) {
    // 终止条件：非对象、null 或已被劫持
    if (typeof value !== 'object' || value === null /*  || value.__ob__ instanceof Observer */) {
        // return value.__ob__;
        return;
    }

    return new Observer(value);
}

/**
 * @description 通过 Object.defineProperty 进行数据劫持，定义响应式数据
 */
function defineReactive(obj, key, val) {
    // 递归处理嵌套对象
    if (typeof val === 'object' && val !== null) {
        observe(val);
    }

    // 依赖收集容器
    const dep = new Dep();

    Object.defineProperty(obj, key, {
        enumerable: true, // 保证属性可枚举
        configurable: true, // 允许后续属性修改
        get() {
            console.log('正在访问属性：', key, '，值为：', val);

            // 依赖收集：这里被触发，说明有观察者正在访问数据，应使用 dep 收集 watcher
            // dep 成了闭包
            // ? 但是，是哪个 watcher 正在访问数据？这个 watcher 需要在 需要在 Watcher 中提前暂存
            if (Dep.target) {
                dep.depend();
            }
            return val;
        },
        set(newVal) {
            if (newVal === val) return; // 避免无意义更新

            // 派发更新：这里被触发，说明正在修改数据，应使用 dep 通知所有依赖
            console.log('正在修改属性：', key, '，新值为：', newVal);
            val = newVal;
            observe(newVal); // 新的值是一个普通数据，记得也要进行劫持
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
    constructor(value) {
        this.value = value;

        if (Array.isArray(value)) {
            // 数组的响应式处理
            // value.__proto__ = arrayMethods; // 通过数组原型链，修改数组方法
            this.observeArray(value);
        } else {
            // 对象的响应式处理
            this.walk(value);
        }
    }

    // 递归定义对象的响应式属性
    walk(obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i], obj[keys[i]]);
        }
    }

    // 递归观测数组元素
    observeArray(items) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(items[i]);
        }
    }
}
