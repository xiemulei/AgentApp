import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    } else if (formData.username.length > 50) {
      newErrors.username = '用户名最多50个字符';
    }

    if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '手机号格式不正确';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.register({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        navigate('/', { replace: true });
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container register-container">
        <div className="login-header">
          <h1>AI Agent</h1>
          <p>创建新账户</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>用户名 *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              disabled={isLoading}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label>密码 *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码（至少6位）"
              disabled={isLoading}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>确认密码 *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入密码"
              disabled={isLoading}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱（可选）"
              disabled={isLoading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入手机号（可选）"
              disabled={isLoading}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </button>

          <div className="form-footer">
            <span>已有账户？</span>
            <Link to="/login">立即登录</Link>
          </div>
        </form>
      </div>
    </div>
  );
}