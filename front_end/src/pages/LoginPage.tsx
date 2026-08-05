import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient'; // استدعاء ملف الاتصال

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // لعرض الإيرور لو الباسوورد غلط
  
  const navigate = useNavigate();

  // تحويل الدالة لـ async
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(''); // تصفير الإيرور قبل الطلب الجديد
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // إرسال طلب تسجيل الدخول للباك إند
      const response = await axiosClient.post('/auth/login', {
        email,
        password
      });

      // استخراج التوكن وبيانات المستخدم من رد السيرفر
      const { token, user } = response.data;
      
      console.log('Login Success! Token:', token);

      // حفظ التوكن وبيانات اليوزر في ذاكرة المتصفح (localStorage)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); 

      // توجيه لصفحة الشات
      navigate('/chat');

    } catch (err: any) {
      console.error('Login Error:', err);
      // عرض رسالة الخطأ اللي راجعة من السيرفر (مثلاً: الإيميل غلط)
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f4f7f6', 
      direction: 'ltr',
      fontFamily: 'Arial, sans-serif'
    }}>
      <form 
        onSubmit={handleLogin} 
        style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
          width: '100%', 
          maxWidth: '350px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px' 
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0', color: '#333' }}>Login</h2>
        
        {/* مكان مخصص لعرض رسالة الخطأ */}
        {error && (
          <div style={{ backgroundColor: '#ffe6e6', color: '#dc3545', padding: '10px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '14px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          Sign In
        </button>

        <p style={{ textAlign: 'center', margin: '0', fontSize: '14px', color: '#666' }}>
          Don't have an account? {' '}
          <span 
            onClick={() => navigate('/register')} 
            style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Register now
          </span>
        </p>
      </form>
    </div>
  );
}