import io from "socket.io-client";

const socket = io('http://localhost:3000', {
    // transports: ['websocket'],
    // withCredentials: true, // Removed as it is not a valid property
});
export default socket;