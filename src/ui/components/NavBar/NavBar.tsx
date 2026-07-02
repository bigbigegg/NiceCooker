import { useUIStore } from '@/stores/uiStore';
import { logger } from '@/utils/Logger';
import './NavBar.css';

const NAV_ITEMS = [
  { id: 'shop' as const, label: '商城', icon: '🛒' },
  { id: 'decoration' as const, label: '装修', icon: '🎨' },
  { id: 'employee' as const, label: '员工', icon: '👥' },
  { id: 'recipes' as const, label: '食谱', icon: '📖' },
  { id: 'inventory' as const, label: '库存', icon: '📦' },
  { id: 'settings' as const, label: '设置', icon: '⚙️' },
];

/** 底部导航栏 */
export function NavBar() {
  const activePanel = useUIStore((s) => s.activePanel);
  const togglePanel = useUIStore((s) => s.togglePanel);

  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-bar__item ${activePanel === item.id ? 'nav-bar__item--active' : ''}`}
          onClick={() => {
            logger.info('app', `👆 导航: ${item.label}`);
            togglePanel(item.id);
          }}
        >
          <span className="nav-bar__icon">{item.icon}</span>
          <span className="nav-bar__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
