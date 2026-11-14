import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-inner">
        <span className="brand">💰 FinTrack</span>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/budget">Budget</NavLink>
        </nav>
        <div className="nav-user">
          <span className="hello">Hi, {user?.name?.split(' ')[0]}</span>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
