import React, { useState } from 'react'
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import { signup } from '../service/api/userApi'

const Signup = () => {

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(password != confirmPassword){
      alert('Passwords do not match!');
      return;
    }
    const res = await signup(username, password, email, phone);
    console.log("Submit", res);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
  }
<input
  name="username"
  value={username}
  type="text"
  placeholder="Enter your username"
  required
  minLength={3}
  className="mt-2 p-3 w-full border border-gray-300 rounded-md bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-blue-500 invalid:border-red-500 valid:border-green-500"
/>

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className='text-2xl font-bold text-center text-white mb-6'>Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white">username:</label>
            <input
              id='username'
              name='username'
              value={username}
              type="text"
              required
              minLength={3}
              placeholder="Enter your username"
              className="mt-2 p-3 w-full text-white border-gray-300 rounded-md bg-slate-700 focus:outline-none focus:border-2 border invalid:border-red-500 valid:border-green-500"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">email:</label>
            <input
              type="email"
              id='email'
              name='email'
              value={email}
              placeholder='Enter your email'
              className="mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white">phone:</label>
            <input
              type="phone"
              id='phone'
              name='phone'
              value={phone}
              placeholder='Enter your phone'
              className="mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-white">Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              placeholder="Enter your password"
              className="mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700 pr-10"
              onChange={(e) => setPassword(e.target.value)}
            />
            <div onClick={() => setShowPassword(!showPassword)} className="absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer">
              {showPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
            </div>
          </div>

          <div className='relative'>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">password:</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id='confirmPassword'
              name='confirmPassword'
              value={confirmPassword}
              placeholder='Enter your confirm your password'
              className="mt-2 p-3 w-full border text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} className='absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer'>
              {showConfirmPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-orange-400 text-white font-semibold rounded-md hover:bg-orange-500 transition duration-200">Sign Up</button>

          <div className="mt-4 text-center">
            <p>have an account? <a href="/" className="text-blue-500 hover:underline">Login</a></p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
