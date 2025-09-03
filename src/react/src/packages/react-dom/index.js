/**
 * react-dom 是 React 源码中负责浏览器环境渲染的核心包
 * 包含将 React 组件（虚拟 DOM/Fiber 树）转换为真实 DOM 的渲染逻辑、事件系统、生命周期桥接等关键代码
 * 作用是将 React 应用在 Web 页面上挂载、更新和渲染到浏览器 DOM 中。​​
 */

export const render = data => {
    console.log('render');
    document.body.innerHTML = `
    <div>
      <h1>${data}</h1>
    </div>
  `;
};
