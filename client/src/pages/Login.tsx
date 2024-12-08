import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpLogin, setIsOtpLogin] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Logging in with:', username, password);
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Logging in with OTP:', otp);
    };

    const handleGoogleLogin = (response: any) => {
        console.log(response);
        // כאן תוכל לשלוח את ה-response לשרת שלך או לעשות עיבוד נוסף
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

                {/* טופס התחברות רגיל */}
                {!isOtpLogin ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* שדה Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* שדה Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* כפתור התחברות */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
                        >
                            Log In
                        </button>

                        {/* כפתור התחברות עם גוגל */}
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => console.log('Login Failed')}
                            useOneTap
                        />

                        {/* לינק להרשמה */}
                        <div className="mt-4 text-center">
                            <p>Don't have an account? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a></p>
                        </div>

                        {/* כפתור להחלפה ל-OTP */}
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setIsOtpLogin(true)}
                                className="text-blue-500 hover:underline"
                            >
                                Login with OTP
                            </button>
                        </div>
                    </form>
                ) : (
                    /* טופס כניסה עם קוד OTP */
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter OTP"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
                        >
                            Verify OTP
                        </button>

                        {/* כפתור חזרה לטופס רגיל */}
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setIsOtpLogin(false)}
                                className="text-blue-500 hover:underline"
                            >
                                Back to Login with Username/Password
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
            <LoginPage />
        </GoogleOAuthProvider>
    );
};

export default App;
