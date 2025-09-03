# Vue 2 响应式原理

👉️ [你真的搞懂 Vue 的响应式了吗](https://www.bilibili.com/video/BV1H44y167Ey/?spm_id_from=333.337.search-card.all.click&vd_source=da6724ff06b295cd88f11f223e834680)

## 核心概括

Vue2 的响应式系统基于 JavaScript 的 `Object.defineProperty` 方法进行 **数据劫持** ，配合 **发布订阅模式** 实现数据与视图的响应式更新。

## 源码核心组件

`Dep` 类、`Watcher` 类、`Observer` 类、`observe()` 函数、`defineReactive()` 函数、`def()` 函数

### Dep 类：依赖收集

管理依赖（Watcher），实现依赖收集与派发更新。

- 每个响应式属性对应一个 Dep 实例。
- 在 getter 中调用 depend() 收集当前 Watcher。
- 在 setter 中调用 notify() 触发依赖更新。
- Dep.target 临时存储依赖收集阶段正在执行的 Watcher 实例，确保依赖关系的准确建立。

```js
class Dep {
  constructor() {
    this.subs = []; // 存储依赖（Watcher）
  }

  addSub(sub) {
    this.subs.push(sub); // 添加依赖
  }

  notify() {
    const subs = this.subs.slice(); // 拷贝依赖列表
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update(); // 触发依赖更新
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this); // 依赖收集
    }
  }
}
```

### Watcher 类：观察者与更新触发

承担着数据变化监听与更新触发的关键角色，其完整生命周期涵盖初始化、依赖收集与更新执行三个阶段，是连接数据模型与视图渲染的桥梁。

- 作为 Dep 和视图的桥梁，监听数据变化并触发视图更新。
- 在 `get()` 中触发 getter，完成依赖收集。
- 在 `update()` 中触发视图更新（如组件重新渲染）。
- Dep 和 Watcher 通过闭包保存依赖关系。

```js
  class Watcher {
  constructor(vm, expOrFn, cb, options) {
    this.vm = vm;
    this.getter = parsePath(expOrFn); // 解析表达式
    this.cb = cb;
    this.options = options;
    this.value = this.get(); // 触发 getter，完成依赖收集
  }

  get() {
    Dep.target = this; // 将当前 Watcher 标记为全局目标
    const value = this.getter.call(this.vm, this.vm); // 执行 getter
    Dep.target = null; // 清除目标
    return value;
  }

  update() {
    const oldValue = this.value;
    this.value = this.get(); // 重新获取值
    this.cb.call(this.vm, this.value, oldValue); // 执行回调
  }

  addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }
}
```

### Observer 类：数据劫持的实现

Observer 类的核心职责是将普通 JavaScript 数据（对象或数组）转化为响应式数据。通过对数据的深度劫持，实现数据变更时的自动响应。

- 负责劫持数据属性，创建 Dep 实例，将普通对象转换为响应式对象。
- 递归遍历对象属性，调用 defineReactive 创建 getter 和 setter。
- 数组的响应式通过重写原型方法实现。

```js
class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep(); // 为对象创建一个 Dep 实例

    // 标记对象已被观测
    def(value, '__ob__', this);
    
    if (Array.isArray(value)) {
      // 数组的响应式处理
      value.__proto__ = arrayMethods; // 通过数组原型链，修改数组方法
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
```

\__ob__ 属性的关键作用：

- 标记响应式：添加 \__ob__ 属性，建立数据与 Observer 实例的关联
- 功能载体：作为 Observer 实例的引用，提供 dep（依赖收集器）、vmCount（引用计数）等核心属性，支撑依赖追踪与数据更新通知机制
- 不可枚举特性（enumerable: false）避免干扰 for...in 等遍历逻辑
  
#### 辅助函数 observe()：响应式处理的入口控制器

判断对象是否需要观测，若未观测则创建 Observer 实例，如果该值已经有观察者，返回现有的观察者。

```js
// 遍历对象属性并使其响应式
function observe(obj) {
  // 终止条件：非对象、null 或已被劫持
  if (typeof obj !== 'object' || obj === null || obj.__ob__ instanceof Observer) {
    return value.__ob__;
  }

  return new Observer(value)
}
```

#### 辅助函数 defineReactive()：进行数据劫持

- 通过 Object.defineProperty 定义 getter 和 setter。
- getter 触发依赖收集，setter 触发依赖更新。

```js
function defineReactive(obj, key, val) {
  // 递归处理嵌套对象
  if (typeof val === 'object' && val !== null) {
    observe(val);
  }

  // 依赖收集容器
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    enumerable: true,   // 保证属性可枚举
    configurable: true, // 允许后续属性修改
    get() {
      // 依赖收集：访问属性时收集当前依赖
      if (Dep.target) {
        dep.depend();
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return; // 避免无意义更新
      val = newVal;
      // 派发更新：修改属性时通知所有依赖
      dep.notify();
    }
  });
}
```

#### 辅助函数 def()：简化属性定义的底层支撑

- 每个响应式属性对应一个 Dep 实例。
- 在 getter 中调用 depend() 收集当前 Watcher。
- 在 setter 中调用 notify() 触发依赖更新。

```js
/** Define a property */
export function def(obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```

### 数组的响应式处理

重写数组的变异方法，在方法执行后手动触发 Dep.notify()。

```js
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(method => {
  const original = arrayProto[method];
  arrayMethods[method] = function(...args) {
    const result = original.apply(this, args); // 调用原生方法
    const ob = this.__ob__; // 获取 Observer 实例
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    if (inserted) ob.observeArray(inserted); // 观测新插入的元素
    ob.dep.notify(); // 手动触发更新
    return result;
  };
});
```

### 流程

![Vue2响应式原理](https://cdn.nlark.com/yuque/0/2025/png/29092218/1756536316358-1fde693a-3af3-487e-b810-abadb2f94402.png?x-oss-process=image%2Fformat%2Cwebp)

### 性能优化

异步更新：通过 nextTick 批量合并更新，避免频繁 DOM 操作。
虚拟 DOM Diff：仅更新差异节点，减少不必要的渲染。

### 缺点

- 无法检测对象属性的添加/删除：需通过 Vue.set 或 Vue.delete 处理。
- 数组索引修改不触发更新：需通过数组变异方法或 Vue.set。
- 性能开销：递归观测深层嵌套对象可能导致内存占用较高。

# Vue 3 响应式原理

## 使用经验

响应式是函数与数据的关联。

1. 被监控的函数：render、computed 回调、watchEffect、watch；
2. 函数运行期间用到了响应式数据；
3. 响应式数据一定是一个 Proxy 对象；

## 前置知识点

### 副作用

指代码执行时除了产生返回值之外，对外部环境产生的任何可观察的变化。

常见的副作用（side effect）：数据请求、手动修改 DOM、localStorage 操作等。

```js
// 无副作用函数
// 纯函数：只依赖输入，无副作用，可预测结果
function sum(a, b) {
  return a + b; 
}

// 无论调用多少次：
sum(2, 3) // 总是返回5
```

```js
// 定时器副作用
function startTimer() {
  setInterval(() => {
    console.log('Tick'); // 副作用：持续输出日志
  }, 1000);
}
```

```js
// 网络请求副作用
async function fetchUser() {
  const res = await fetch('/api/user'); // 副作用：发起网络请求
  const data = await res.json();
  return data;
}
```

### 数据结构

#### WeakMap **（顶层存储）**

**键**：原始对象（`rawObject`）

**值**：`Map` 对象（存储该对象的所有依赖）

**关系**：`原始对象 → 依赖映射表`

**特点**：弱引用，不阻止原始对象被 GC 回收

```js
// 全局 WeakMap 结构
const targetMap = new WeakMap();

// 示例：
const user = { name: "Alice" }; // 原始对象
targetMap.set(user, new Map()); // 键：user对象，值：新建的Map
```

#### Map **（依赖映射）**

**键**：响应式对象的属性名（`string | symbol`）

**值**：`Set` 对象（存储该属性的所有副作用函数）

**关系**：`属性名 → 副作用集合`

**特点**：精确到属性级的依赖追踪

```javascript
// 从 WeakMap 获取对象的依赖映射
const depsMap = targetMap.get(user);

// 为 name 属性创建依赖集合
depsMap.set("name", new Set());
// 结构示意：
// {
//   "name" → Set[effect1, effect2],
//   "age"  → Set[effect3]
// }
```

#### Set **（副作用集合）**

**存储内容**：副作用函数（`effect`）

**关系**：`属性变更时需要执行的函数集合`

**特点**：自动去重，确保同一函数不重复添加，比数组好用。

```javascript
const nameEffects = depsMap.get("name");

function updateDOM() {
  document.title = user.name;
}

nameEffects.add(updateDOM); // 添加副作用函数
```

![树形数据结构](https://cdn.nlark.com/yuque/0/2025/png/29092218/1756658650252-88303674-1301-46f4-8726-663f389a7268.png?x-oss-process=image%2Fformat%2Cwebp)

## 响应式系统的基本实现

### 1. 实现 Dep 依赖收集

Dep 负责收集副作用。

Set 存储具体的副作用，能自动去重，避免重复执行。

```javascript
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
```

### 2. 实现副作用管理模块

Vue 2 的 Watcher 作为通用的"观察者"，在 Vue 3 中被拆解为 ReactiveEffect/ComputedRef/WatchAPI

所以，`ReactiveEffect` 在某种程度上可以理解为是 Vue3 的“Watcher”。

```javascript
// 当前激活的 effect
export let activeEffect = null;

// 简化的 ReactiveEffect 类
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
```

### 3. Reactive 的实现

`reactive`可以类比成 Vue2 中的 Observer 类，在这里使用 Proxy 实现数据的劫持、Dep 的副作用收集与派发更新。

```javascript
import Dep, { createDep } from './dep.js';
import { activeEffect } from './effect.js';

// 顶层存储，存储该对象的所有依赖
export const targetMap = new WeakMap();

// 收集依赖
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

// dep 与 effect 建立双向连接
function trackEffects(dep) {
    // 如果当前 effect 尚未加入此依赖集合
    if (!dep.subscribers.has(activeEffect)) {
        dep.addSub(activeEffect); // 将 effect 添加到 dep
        activeEffect.deps.push(dep); // 将 dep 添加到 effect 的 deps 数组中
    }
}

// 触发更新
export function trigger(target, key) {
    // 1. 获取目标对象的依赖 Map
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    // 2. 再从 Map 中获取属性的依赖 Dep
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
```

## 调度执行

触发副作用函数重新执行时，有能力决定执行时机、次数、方式。

注册副作用的函数支持第二个选项参数 scheduler 调度器，在触发副作用时，将副作用函数当做回调参数传递过去，让用户自己控制如何执行。

```javascript
// 注册副作用的函数
function effetc(fn, options = {}) {
  const effetcFn = () => {
    // ...
  }

  // 将 options 挂载到 effectFn 上
  effetcFn.options = options;

  effetcFn();
}

// 触发副作用的函数
function trigger(target, key) {
  // 如果一个副作用存在调度器，则调用该调度器，并将副作用函数作为参数传递
  if (effectFn.options.scheduler) {
    effectFn.options.scheduler(effectFn);
  } else {
    effectFn();
  }
}
```

## 计算属性 computed 与 lazy

- lazy 惰性

与调度器类似，也通过第二个 options 参数显式地传入 `{ lazy: true }`。所以，当 `options.lazy` 为 `true` 时，不立即执行副作用函数，而是返回该函数（并非原函数 fn()，而是包装过的 effectFn()），用户手动调用时就能获取其返回值。

```javascript
function effect(fn, options) {
  const effectFn = () => {
    // 略......
    // 将 fn 的执行结果存储到 res 中
    const res = fn();
    // 将 res 作为 effectFn 的返回值
    return res;
  };
  effectFn.options = options;
  // 非 lazy 才执行
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}
```

- 懒计算（实现只有当读取 value 时，才会执行 effectFn 并返回计算结果）

封装一个 computed 函数，返回一个对象，利用对象的 getter 返回 effectFn 的调用。

```javascript
function computed(getter) {
  // 使用 effect() 创建一个 lazy 的 getter 副作用函数
  const effectFn = effect(getter, { lazy: true });

  // 利用 obj 的 getter 返回该函数的调用
  const obj = {
    get value() {
      return effectFn();
    }
  }

  return obj;
}
```

此时，只有当真正读取 `.value` 值时，它才会计算并得到值

- 缓存

`value`：缓存上一次计算的值；

`dirty`：表示是否需要重新计算；

```javascript
function computed(getter) {
  let value;
  let dirty = true;

  // 使用 effect() 创建一个 lazy 的 getter 副作用函数
  const effectFn = effect(getter, {
    lazy: true,
    // 添加调度器，在数据更新触发 trigger 时，会重置 dirty 为 false 
    scheduler() {
      dirty = false;
    }
  });

  // 利用 obj 的 getter 返回该函数的调用
  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
      }
      return value;
    }
  }

  return obj;
}
```

## watch 的实现原理

本质就是观测一个响应式数据，当数据发生变化时，通知并执行响应的回调函数。

- 如何做到当数据发生变化，调用副作用函数

利用`options.scheduler` 调度器，在数据发生变化后执行

```javascript
function watch(source, cb) {
  effect(
    () => source.foo,
    {
      // 数据发生变化，触发 trigger 时，便可在这里执行用户的回调
      scheduler() {
        cb();
      }
    }
  );
}
```

- 如何读取对象上任意属性

封装一个 traverse 函数递归读取数据，并让其支持传入一个函数

```javascript
function traverse(value, seen = new Set()) {
  // 读取的原始值，或者已经被读取过了，什么都不用做  
  if (typeof value !== 'object' || value === null || seen.has(value)) return;

  // 将数据添加到 seen 中，代表已经遍历过，避免循环引用引起的死循环
  seen.add(value)

  // 如果是对象，则循环读取里面的每一个数据
  for (const k in value) {
    traverse(value[k], seen)
  }

  return value
}

function watch(source, cb) {
  // 支持直接传入 getter 函数
  let getter;
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = traverse(source);
  }

  effect(getter,{
    scheduler() {
      cb();
    }
  });
}
```

- 获取新值和旧值

充分利用 effect 函数的 `lazy` 选项

```javascript
function watch(source, cb) {
  // 处理 getter，略....

  let oldValue, newValue;

  const effectFn = effect(getter,{
    lazy: true,
    scheduler() {
      // 在 trigger 触发时，会执行副作用函数
      newValue = effectFn();
      cb(oldValue, newValue);
      // 更新旧值，不然下一次会得到错误的旧值
      oldValue = newValue;
    }
  });

  // 手动调用副作用函数，拿到的值就是旧值（这里先执行）
  oldValue = effectFn();
}
```

- `immediate` 立即执行

将 scheduler 中的逻辑封装起来，根据 immediate 看是否需要先执行一次。

```javascript
function watch(source, cb, options = {}) {
  // 处理 getter，略....
  let oldValue, newValue;

  const job = () => {
    newValue = effectFn();
    cb(oldValue, newValue);
    oldValue = newValue;
  }

  const effectFn = effect(getter,{
    lazy: true,
    scheduler() {
      job();
    }
  });

  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}
```

- 支持 `flush` 调整回调函数的刷新时机

flush 本质上是指调度函数的执行时机。默认情况下，侦听器回调会在父组件更新 (如有) **之后**、所属组件的 DOM 更新 **之前**被调用。

```javascript
function watch(source, cb, options = {}) {
  // 略...

  const effectFn = effect(getter,{
    lazy: true,
    scheduler() {
      if (options.flush === 'post') {
        // 放入微任务中，等待 DOM 更新结束后在执行。
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    }
  });

  // 略...
}
```

# React

React 核心四个包，以及阅读源码的理解顺序：

1. react-dom

   处理端能力，将 React 组件（虚拟 DOM/Fiber 树）转换为真实 DOM 的渲染逻辑、事件系统、生命周期桥接等关键代码。

   - createRoot() → createContainer()
   - render() → updateContainer()

2. react

   统一为外部开发者提供接口协议。

   - useState、useEffect → resolveDispatcher()

3. react-reconciler

   包含虚拟 DOM Diff 算法、Fiber 架构实现、组件渲染与更新调度等关键逻辑.

   - createFiberRoot()
   - initializeUpdateQueue()
   - updateContainer()
   - createUpdate()
   - enqueueUpdate()

4. scheduler

   优化任务优先级调度、时间切片等。

   - 使用小跟堆（Main Heap）进行优先级的处理
