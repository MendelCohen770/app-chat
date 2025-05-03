import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import { useEffect } from 'react';
import socket from './service/socket';

function App() {
  
  useEffect(() => {
    socket.on("connect", () => {
      console.log("התחברנו לשרת עם מזהה:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/signup" element={<Signup/>} />
      <Route path='/home' element={<Home/>}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
