import { Server, Socket } from "socket.io";

const setUpSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("🔌 New client connected:", socket.id);
        io.on("connected", ( ()=>{
          io.emit( socket.id);
        }))
        
        socket.on("sendMessage", (data) => {
          console.log("📨 Message received:", data);
    
          // שלח לכל הלקוחות (כולל השולח)
          io.emit("newMessage", data);
        });
    
        socket.on("disconnect", () => {
          console.log("❌ Client disconnected:", socket.id);
        });
    });
}
export default setUpSocket;