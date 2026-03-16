import type { UserInfo } from '../types/api';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
  user: UserInfo | null;
  onLogout: () => void;
}

export function Header({ onMenuClick, user, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-info">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.username} className="user-avatar" />
            )}
            <span className="username">{user.username}</span>
            <button className="logout-btn" onClick={onLogout}>
              退出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
