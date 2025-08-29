import { observe, defineReactive } from './observer/index.js';
import Watcher from './watcher/index.js';

function Vue(options) {
    Object.keys(options).forEach(key => {
        this[key] = options[key];
    });

    // 响应式处理
    observe(this.data);

    // 创建观察者（每一个属性，都是一个 Watcher 实例）
    new Watcher(this, 'data');
    new Watcher(this, 'data.count');
    new Watcher(this, 'data.user');
    new Watcher(this, 'data.user.name');
    new Watcher(this, 'data.user.age');
    new Watcher(this, 'data.list');
}

Vue.$set = function (data, key, value) {
    data[key] = value;
    if (!Array.isArray(value)) {
        defineReactive(data, key, value);
    }

    // 新添加的属性直接在这里使用 __ob__ 保存的 Observer 实例派发更新
    // 在 Observer 中已经额外添加了 dep
    data.__ob__.dep.notify();
};

let vm = new Vue({
    data: {
        count: 123,
        user: {
            name: '张三',
            age: 18,
        },
        list: ['啊啊啊', '哈哈哈', '呵呵呵'],
    },
    test() {
        this.data.count++;
        this.data.user.name = '李四';
        Vue.$set(this.data.list, 3, '嘎嘎嘎');
        this.data.list.push('哦哦哦');
    },
});

vm.test();
