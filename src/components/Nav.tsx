import { NavLink, useLocation } from 'react-router';
import styles from '@/components/Nav.module.css';

function isSectionActive(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function Nav() {
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      <NavLink to="/" data-active={location.pathname === '/'}>
        Xiaolin
      </NavLink>
      <div className={styles.links}>
        <NavLink to="/tools" data-active={isSectionActive(location.pathname, '/tools')}>
          Tools
        </NavLink>
        <NavLink to="/demos" data-active={isSectionActive(location.pathname, '/demos')}>
          Demos
        </NavLink>
        <NavLink to="/blog" data-active={isSectionActive(location.pathname, '/blog')}>
          Blog
        </NavLink>
      </div>
    </nav>
  );
}
