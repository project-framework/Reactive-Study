import { observe, defineReactive, set } from './observer/index.js';
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

Vue.$set = set;

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
