/** React 伪实现 */

//#region useState 伪实现
const queue = []; // 链表
let index = 0; // 指针
const useState = initialState => {
    queue.push(initialState);

    const update = state => {
        queue.push(state);
        index++;
    };

    return [queue[index], update];
};
//#endregion

// 跟 hook 关联性很大的一个特性：currentDispatcher → resolveDispatcher()
const [count, setCount] = useState(0);

window.addEventListener(
    'click',
    () => {
        setCount(queue[index] + 1);
    },
    false
);

// 渲染函数
const render = () => {
    console.log('render');
    document.body.innerHTML = `
    <div>
      <h1>${queue[index]}</h1>
    </div>
  `;
};
render();

//#region diff 过程（协调）
let prevCount = count;
const reconcile = () => {
    if (prevCount !== queue[index]) {
        render();
        prevCount = queue[index];
    }
};
//#endregion

//#region 任务调度器（两大循环之一）
const workLoop = () => {
    reconcile();
    requestIdleCallback(workLoop); // 已经用 MessageChannel 替代
};
workLoop();
//#endregion
