import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, presentations(*)');

  return (
    <div style={{ padding: 40, color: 'white', background: '#0e0e0e', minHeight: '100vh' }}>
      <h1>디버그</h1>
      <h2>환경변수</h2>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <h2>에러</h2>
      <pre>{JSON.stringify(error, null, 2)}</pre>
      <h2>데이터</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
