'use client';

import { useState } from 'react';
import Link from 'next/link';

const ADMIN_PASSWORD = 'wenners1!';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      window.location.href = '/admin/dashboard';
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '56px', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}>
          <span style={{ background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 12, padding: '2px 7px', borderRadius: 3 }}>TED</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>위너스 TED쇼</span>
        </Link>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="card fade-up" style={{ width: '100%', maxWidth: 380, padding: 36 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>관리자 로그인</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>발표 관리 및 설문 결과 확인</p>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 15, padding: '12px 14px', outline: 'none', fontFamily: 'sans-serif' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--red)'; e.target.style.background = '#fff'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg3)'; }}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-dim)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>{error}</p>}
          <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 15 }}>
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
