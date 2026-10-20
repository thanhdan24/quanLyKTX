import { createContext, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY, USER_KEY, setCurrentUser, closeModal } from '../../assets/js/core';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function saveUser(value) {
    setCurrentUser(value);
    setUser(value);
    if (value) localStorage.setItem(USER_KEY, JSON.stringify(value));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    saveUser(null);
    closeModal();
  }

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      try {
        if (localStorage.getItem(TOKEN_KEY)) {
          const result = await api('/api/auth/me', { signal: controller.signal });
          saveUser(result.user);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (err.status === 401) logout();
        else setError('Chưa kết nối được máy chủ. Vui lòng kiểm tra backend và thử đăng nhập lại.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    restore();
    window.addEventListener('qlktx:unauthorized', logout);
    return () => {
      controller.abort();
      window.removeEventListener('qlktx:unauthorized', logout);
    };
  }, []);

  async function login(payload) {
    setError('');
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem(TOKEN_KEY, result.token);
    saveUser(result.user);
  }

  return <AuthContext.Provider value={{ user, loading, error, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
