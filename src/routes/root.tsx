import { Outlet } from 'react-router';
import { Nav } from '@/components/Nav';

export function Component() {
  return (
    <div className="site-shell">
      <Nav />
      <div className="site-content">
        <Outlet />
      </div>
    </div>
  );
}
