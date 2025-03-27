import React, { useState } from 'react'
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import { signup } from '../hooks/UseUser'
import { ISignup } from '../models/signup';
import { IResponse } from '../models/response';

const Signup = () => {

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });

  const handleFocus = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!username ||!email ||!password ||!confirmPassword ||!phone){
      alert('All fields are required!');
      return;
    };
    if(password != confirmPassword){
      alert('Passwords do not match!');
      return;
    };
    const user: ISignup = {username, password, email, phone};
    const response: IResponse = await signup(user);
    if(!response.isSuccessful){
      console.log(response.displayMessage);
      return;
    }
    console.log("Submit", response);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 select-none">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className='text-2xl font-bold text-center text-gray-400 mb-6'>Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-400">username:</label>
            <input
              id='username'
              name='username'
              value={username}
              type="text"
              required
              minLength={3}
              placeholder="Enter your username"
              className={`mt-2 p-3 w-full text-white border-gray-300 rounded-md bg-slate-700 focus:outline-none focus:border-2 border ${touched.username && ('valid:border-green-500 invalid:border-red-500')} `}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => handleFocus('username')}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">email:</label>
            <input
              type="email"
              id='email'
              name='email'
              required
              value={email}
              placeholder='Enter your email'
              className={`mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:border-2 bg-slate-700 ${touched.email && ('valid:border-green-500 invalid:border-red-500')}`}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => handleFocus('email')}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-400">phone:</label>
            <input
              type="phone"
              id='phone'
              name='phone'
              required
              value={phone}
              placeholder='Enter your phone'
              className={`mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:border-2 bg-slate-700 ${touched.phone && ('valid:border-green-500 invalid:border-red-500')}`}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => handleFocus('phone')}
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              required
              value={password}
              placeholder="Enter your password"
              className={`mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:border-2 bg-slate-700 pr-10 ${touched.password && ('valid:border-green-500 invalid:border-red-500')}`}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => handleFocus('password')}
            />
            <div onClick={() => setShowPassword(!showPassword)} className="absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer">
              {showPassword ? <VscEye size={20} className='text-blue-500' /> : <VscEyeClosed size={20} className='text-blue-500' />}
            </div>
          </div>

          <div className='relative'>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">password:</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id='confirmPassword'
              name='confirmPassword'
              required
              value={confirmPassword}
              placeholder='Enter your confirm your password'
              className={`mt-2 p-3 w-full border text-gray-400 border-gray-300 rounded-md focus:outline-none focus:border-2 bg-slate-700 ${touched.confirmPassword && ('valid:border-green-500 invalid:border-red-500')}`}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => handleFocus('confirmPassword')}
            />
            <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} className='absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer'>
              {showConfirmPassword ? <VscEye size={20} className='text-blue-500'/> : <VscEyeClosed size={20} className='text-blue-500' />}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-orange-400 text-white font-semibold rounded-md hover:bg-orange-500 transition duration-200">Sign Up</button>

          <div className="mt-4 text-center">
            <p className='text-white'>have an account? <a href="/" className="text-blue-500 hover:underline">Login</a></p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
