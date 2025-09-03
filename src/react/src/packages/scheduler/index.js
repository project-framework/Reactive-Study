/**
 * scheduler 是 React 源码中负责任务调度与优先级管理的核心包
 * 包含任务队列、时间切片、帧调度等实现文件
 * 作用是控制 React 更新任务的执行顺序与时机，确保高优先级任务（如用户交互）优先执行，提升应用响应速度与性能。​
 */

//#region 任务调度器（两大循环之一）
export const workLoop = reconcile => {
    reconcile();
    requestIdleCallback(() => {
        workLoop(reconcile);
    }); // 已被 MessageChannel 替代
};
//#endregion
