require("dotenv").config()
const http = require('http');
const express = require("express");
const { connectToDb } = require("./src/db/connection");
const { router } = require("./src/routes/UserRoutes");
var cookieParser = require('cookie-parser')
const {Server} = require('socket.io');
const adminRoute = require("./src/routes/AdminRoutes");

const app = express();
const server = http.createServer(app)
const io = new Server(server);

app.use(express.json());
app.use(cookieParser())
app.use("/api/v1/user", router);
app.use("/api/v1/admin",adminRoute);

const PORT = process.env.PORT || 4000


io.on("connection", (socket)=>{
    console.log("User connected to socket io")
    socket.on('chat message', (msg) => {
        
        
        io.emit('chat message', msg);
      });
    socket.on("disconnect",()=>{
        console.log("User Disconnected");
    })
});





connectToDb.then(()=>{
    console.log('Connected to Database');
   
    server.listen(PORT, ()=>{
       
        console.log(`Server is running on port ${PORT}`);
    });
});