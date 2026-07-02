import ReactDOM from 'react-dom/client';
import { App } from './App';

// 注意：不使用 StrictMode。游戏引擎（GameLoop/EventBus）依赖单例和副作用时序，
// StrictMode 的双挂载会导致系统注册重复、事件监听泄露、rAF 中断等问题。
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
