import io from "socket.io-client";
let socket: ReturnType<typeof io> | null = null;
export const connectSocket = (userId: string) => {
    socket = io('http://localhost:3000', {
        transports: ['websocket'],
        transportOptions: {
            polling: {
                extraHeaders: {
                    // Headers שאתה רוצה לשלוח כמו Authorization
                },
                withCredentials: true, // כאן המקום הנכון
            },
        },
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected');
        socket?.emit('register', userId); // רישום המשתמש בשרת
    });
};


export const getSocket = () => socket;