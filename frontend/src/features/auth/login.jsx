import  { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../utils/api';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  identifier: z.string().min(4, 'ID is required'),
  password: z.string().min(6, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();  
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      // Adjust payload based on whether user types National ID or Employee ID
      const payload = data.identifier.startsWith('EMP') || data.identifier.startsWith('TECH') 
        ? { employeeId: data.identifier, password: data.password }
        : { nationalId: data.identifier, password: data.password };

      const response = await api.post('/users/login', payload);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role); 
      
      // Routing logic here based on role
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans text-[#37352f]">
      <div className="w-full max-w-[400px] p-8 bg-white rounded-lg shadow-sm border border-[#e9e9e7]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">UrbanFix</h1>
          <p className="text-[#787774] mt-1 text-sm">Enter your credentials to continue</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#787774] mb-1">ID (National / Employee)</label>
            <input 
              {...register('identifier')}
              className="w-full px-3 py-2 bg-[#f7f7f5] border border-transparent rounded-md focus:bg-white focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition-all sm:text-sm"
              placeholder="e.g. 29801011234567 or EMP-1001"
            />
            {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#787774] mb-1">Password</label>
            <input 
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 bg-[#f7f7f5] border border-transparent rounded-md focus:bg-white focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition-all sm:text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-2 flex justify-center items-center gap-2 bg-[#2383e2] text-white py-2 px-4 rounded-md hover:bg-[#1a65af] transition-colors text-sm font-medium disabled:opacity-70"
          >
            {isSubmitting ? 'Authenticating...' : <><LogIn size={16} /> Continue</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;