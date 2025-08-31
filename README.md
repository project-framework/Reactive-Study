# Vue 2 响应式原理

👉️ [你真的搞懂 Vue 的响应式了吗](https://www.bilibili.com/video/BV1H44y167Ey/?spm_id_from=333.337.search-card.all.click&vd_source=da6724ff06b295cd88f11f223e834680)

## 核心概括

Vue2 的响应式系统基于 JavaScript 的 `Object.defineProperty` 方法进行**数据劫持** ，配合**发布订阅模式**实现数据与视图的响应式更新。

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
