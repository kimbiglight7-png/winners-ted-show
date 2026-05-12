'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    } else {
      window.location.href = '/admin/dashboard';
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="admin@winners-ted.com"
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 15, padding: '12px 14px', outline: 'none', fontFamily: 'sans-serif' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--red)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg3)'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>비밀번호</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 15, padding: '12px 14px', outline: 'none', fontFamily: 'sans-serif' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--red)'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg3)'; }} />
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-dim)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>{error}</p>}
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 15 }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>Supabase Authentication으로 보호됩니다</p>
        </div>
      </div>
    </div>
  );
}
