import { render } from './src/packages/react-dom/index.js';
import { reconcile, useState, queue, index } from './src/packages/react-reconciler/index.js';
import { workLoop } from './src/packages/scheduler/index.js';

// 声明响应式数据（现在还不是响应式）
const [_count, setCount] = useState(0);

// 注册事件
window.addEventListener(
    'click',
    () => {
        setCount(queue[index] + 1);
    },
    false
);

// 渲染函数
render(queue[index]);

// 调度更新
workLoop(() => {
    reconcile(queue[index], render.bind(this));
});
