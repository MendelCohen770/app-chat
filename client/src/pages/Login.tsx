import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import { login} from '../hooks/UseUser'
import { IResponse } from '../models/response';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [touched, setTouched] = useState({
        username: false,
        password: false
    });

    const handleFocus = (field: string) => {
        setTouched({ ...touched, [field]: true });
    };
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!username || !password){
            alert('Please fill in all fields');
            return;
        };
        const res: IResponse = await login(username, password);
        if(!res.isSuccessful){
            console.log(res.displayMessage);
            return;
        }
        console.log(res.data);
        console.log('Logging in with:',res);
        setUsername('');
        setPassword('');
        navigate('/home');
    }

    const handleGoogleLogin = () => {

    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 select-none">
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className='text-2xl font-bold text-center text-gray-400 mb-6'>Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-400">username:</label>
                        <input
                            id='username'
                            name='username'
                            value={username}
                            type="text"
                            required
                            placeholder="Enter your username"
                            className={`mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:border-2 bg-slate-700 text-white ${touched.username && ('valid:border-green-500 invalid:border-red-500')}`}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => handleFocus('username')}
                        />
                    </div>

                    <div className='relative'>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-400">password:</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id='password'
                            name='password'
                            required
                            value={password}
                            placeholder='Enter your password'
                            className={`mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none  focus:border-2 bg-slate-700 text-white ${touched.password && ('valid:border-green-500 invalid:border-red-500')}`}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => handleFocus('password')}
                        />
                        <div onClick={() => setShowPassword(!showPassword)} className="absolute bottom-1 right-5 transform -translate-y-1/2 cursor-pointer ">
                            {showPassword ? <VscEye size={20}/> : <VscEyeClosed size={20}/>}
                        </div>
                    </div>

                    <GoogleLogin
                             onSuccess={handleGoogleLogin}
                             onError={() => console.log('Login Failed')}
                             useOneTap
                         />

                    <button type="submit" className="w-full py-3 bg-orange-400 text-white font-semibold rounded-md hover:bg-orange-500 transition duration-200">Login</button>

                    <div className="mt-4 text-center">
                        <p className='text-white'>Don't have an account? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a></p>
                   </div>
                </form>
            </div>
        </div>
    )
    // const [username, setUsername] = useState('');
    // const [password, setPassword] = useState('');
    // const [otp, setOtp] = useState('');
    // const [isOtpLogin, setIsOtpLogin] = useState(false);
    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     console.log('Logging in with:', username, password);
    // };

    // const handleOtpSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     console.log('Logging in with OTP:', otp);
    // };

    // const handleGoogleLogin = (response: any) => {
    //     console.log(response);
    //     // כאן תוכל לשלוח את ה-response לשרת שלך או לעשות עיבוד נוסף
    // };

    // return (
    //     <div className="flex items-center justify-center min-h-screen bg-gray-100">
    //         <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
    //             <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

    //             {/* טופס התחברות רגיל */}
    //             {!isOtpLogin ? (
    //                 <form onSubmit={handleSubmit} className="space-y-4">
    //                     {/* שדה Username */}
    //                     <div>
    //                         <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
    //                         <input
    //                             type="text"
    //                             id="username"
    //                             name="username"
    //                             value={username}
    //                             onChange={(e) => setUsername(e.target.value)}
    //                             className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //                             placeholder="Enter your username"
    //                         />
    //                     </div>

    //                     {/* שדה Password */}
    //                     <div>
    //                         <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
    //                         <input
    //                             type="password"
    //                             id="password"
    //                             name="password"
    //                             value={password}
    //                             onChange={(e) => setPassword(e.target.value)}
    //                             className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //                             placeholder="Enter your password"
    //                         />
    //                     </div>

    //                     {/* כפתור התחברות */}
    //                     <button
    //                         type="submit"
    //                         className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
    //                     >
    //                         Log In
    //                     </button>

    //                     {/* כפתור התחברות עם גוגל */}
    //                     <GoogleLogin
    //                         onSuccess={handleGoogleLogin}
    //                         onError={() => console.log('Login Failed')}
    //                         useOneTap
    //                     />

    //                     {/* לינק להרשמה */}
    //                     <div className="mt-4 text-center">
    //                         <p>Don't have an account? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a></p>
    //                     </div>

    //                     {/* כפתור להחלפה ל-OTP */}
    //                     <div className="mt-4 text-center">
    //                         <button
    //                             type="button"
    //                             onClick={() => setIsOtpLogin(true)}
    //                             className="text-blue-500 hover:underline"
    //                         >
    //                             Login with OTP
    //                         </button>
    //                     </div>
    //                 </form>
    //             ) : (
    //                 /* טופס כניסה עם קוד OTP */
    //                 <form onSubmit={handleOtpSubmit} className="space-y-4">
    //                     <div>
    //                         <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
    //                         <input
    //                             type="text"
    //                             id="otp"
    //                             name="otp"
    //                             value={otp}
    //                             onChange={(e) => setOtp(e.target.value)}
    //                             className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //                             placeholder="Enter OTP"
    //                         />
    //                     </div>

    //                     <button
    //                         type="submit"
    //                         className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
    //                     >
    //                         Verify OTP
    //                     </button>

    //                     {/* כפתור חזרה לטופס רגיל */}
    //                     <div className="mt-4 text-center">
    //                         <button
    //                             type="button"
    //                             onClick={() => setIsOtpLogin(false)}
    //                             className="text-blue-500 hover:underline"
    //                         >
    //                             Back to Login with Username/Password
    //                         </button>
    //                     </div>
    //                 </form>
    //             )}
    //         </div>
    //     </div>
    // );
};

const App: React.FC = () => {
    return (
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
            <LoginPage />
        </GoogleOAuthProvider>
    );
};

export default App;
