import React, { useState } from 'react'
import { VscEyeClosed, VscEye } from "react-icons/vsc";

const Signup = () => {

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit");
  }

  const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }

  const handleConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-200">
      <div className="bg-yellow-300 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">username:</label>
            <input
              id='username'
              name='username'
              value={username}
              type="text"
              placeholder="Enter your username"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-200"
              onChange={(e) => handleUsername(e)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">email:</label>
            <input
              type="email"
              id='email'
              name='email'
              value={email}
              placeholder='Enter your email'
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-200"
              onChange={(e) => handleEmail(e)}
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              placeholder="Enter your password"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-200 pr-10"
              onChange={(e) => handlePassword(e)}
            />
            <div onClick={() => setShowPassword(!showPassword)} className="absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer">
              {showPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
            </div>
          </div>

          <div className='relative'>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">password:</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id='confirmPassword'
              name='confirmPassword'
              value={confirmPassword}
              placeholder='Enter your confirm your password'
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-200"
              onChange={(e) => handleConfirmPassword(e)}
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
