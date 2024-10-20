const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../client'))); // Serve static files from client directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

let connectedSockets = []; // Track connected sockets

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Limit to 2 connections
    if (connectedSockets.length >= 2) {
        socket.emit('error', 'Maximum number of connections reached.');
        socket.disconnect();
        return;
    }
    connectedSockets.push(socket);

    // Handle incoming signals
    socket.on('offer', (offer) => {
        console.log(`Received offer from ${socket.id}:`, offer);
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log(`Received answer from ${socket.id}:`, answer);
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        console.log(`Received ICE candidate from ${socket.id}:`, candidate);
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        connectedSockets = connectedSockets.filter(s => s !== socket);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
