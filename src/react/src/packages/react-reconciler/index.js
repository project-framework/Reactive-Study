/**
 * react-reconciler 是 React 源码中负责协调（Reconciliation）的核心模块
 * 它包含虚拟 DOM Diff 算法、Fiber 架构实现、组件渲染与更新调度等关键逻辑
 * 作用是驱动 React 组件从 JSX 到真实 DOM 的高效渲染与更新过程。​
 */

export const queue = []; // 链表
export let index = 0; // 指针
export const useState = initialState => {
    queue.push(initialState);

    const update = state => {
        queue.push(state);
        index++;
    };

    return [queue[index], update];
};

//#region diff 过程（协调）
let prevCount = 0;
export const reconcile = (value, render) => {
    if (prevCount !== value) {
        render(value);
        prevCount = value;
    }
};
//#endregion
