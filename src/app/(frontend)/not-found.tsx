export default function NotFound() {
  return (
    <html lang="vi">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#cbd5e1', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
        <main>
          <p style={{ fontSize: 48, fontWeight: 800, margin: 0, color: '#f8fafc' }}>404</p>
          <p style={{ margin: '8px 0 24px' }}>Không tìm thấy trang bạn yêu cầu.</p>
          <a href="/" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>← Về trang chủ BillPulse</a>
        </main>
      </body>
    </html>
  );
}
