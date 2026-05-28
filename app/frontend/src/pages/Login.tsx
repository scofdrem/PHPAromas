import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let success: boolean;
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await register({
          email,
          password,
          password_confirmation: passwordConfirm,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        });
      }

      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#C69B56] tracking-[0.2em] mb-2">
            1000 АРОМАТОВ
          </h1>
          <h2 className="text-white/70 text-sm tracking-[0.15em]">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/50 text-xs tracking-[0.1em] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-[#C69B56]/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C69B56]/50 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs tracking-[0.1em] mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-[#C69B56]/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C69B56]/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-white/50 text-xs tracking-[0.1em] mb-2">
                  Подтверждение пароля
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-[#C69B56]/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C69B56]/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs tracking-[0.1em] mb-2">
                    Имя (необязательно)
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/5 border border-[#C69B56]/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C69B56]/50 transition-colors"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs tracking-[0.1em] mb-2">
                    Фамилия (необязательно)
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/5 border border-[#C69B56]/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C69B56]/50 transition-colors"
                    placeholder="Петров"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C69B56] hover:bg-[#C69B56]/90 disabled:opacity-50 text-black font-semibold tracking-[0.1em] py-3 rounded-lg transition-colors mt-4"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-white/50 hover:text-[#C69B56] text-sm tracking-[0.1em] transition-colors"
          >
            {isLogin
              ? 'Нет аккаунта? Зарегистрируйтесь'
              : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    </div>
  );
}