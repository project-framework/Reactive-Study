import { reactive } from './reactive.js';
import { effect } from './watch.js';

// 1. 定义响应式数据
const state = reactive({
    count: 0,
});

// 2. 渲染函数
function render() {
    document.body.innerHTML = `
    <div>
        <div>count: ${state.count}</div>
    </div>
    `;
}

// 3. 副作用
effect(() => render());

// 4. 事件监听
const add = () => void state.count++;
document.body.addEventListener('click', add);
