import { reactive } from './reactive.js';
import { effect } from './effect.js';

// 定义响应式数据
const state = reactive({
    count: 0,
    message: 'Hello',
});

// 交互函数
export function increment() {
    state.count++;
}
export function changeMessage() {
    state.message = state.message === 'Hello' ? 'World' : 'Hello';
}

// 创建副作用 - 更新计数
effect(() => {
    document.getElementById('counter').textContent = state.count;
    console.log('计数更新:', state.count);
});

// 创建副作用 - 更新消息
effect(() => {
    document.getElementById('message').textContent = state.message;
    console.log('消息更新:', state.message);
});

// 事件监听
const countBtn = document.querySelector('.count-btn');
countBtn.addEventListener('click', increment);

const msgBtn = document.querySelector('.msg-btn');
msgBtn.addEventListener('click', changeMessage);
