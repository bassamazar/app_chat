import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient'; // استدعاء ملف الاتصال بالباك إند

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // تحويل الدالة لـ async عشان نستخدم await مع الـ API
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    
    // تحقق بسيط من البيانات
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // إرسال البيانات للباك إند
      const response = await axiosClient.post('/auth/register', {
        username,
        email,
        password
      });

      console.log('Registration Success:', response.data);
      alert('Account created successfully!');
      
      // التوجيه لصفحة الدخول بعد النجاح
      navigate('/login');
      
    } catch (err: any) {
      console.error('Registration Error:', err);
      // عرض رسالة الخطأ اللي راجعة من السيرفر، أو رسالة عامة لو السيرفر طافي
      setError(err.response?.data?.message || 'Something went wrong, please try again.');
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
        onSubmit={handleRegister} 
        style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
          width: '100%', 
          maxWidth: '350px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px' 
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#333' }}>Create Account</h2>
        
        {error && (
          <div style={{ backgroundColor: '#ffe6e6', color: '#dc3545', padding: '10px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Ahmad123"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '14px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          Sign Up
        </button>

        <p style={{ textAlign: 'center', margin: '0', fontSize: '14px', color: '#666' }}>
          Already have an account? {' '}
          <span 
            onClick={() => navigate('/login')} 
            style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}