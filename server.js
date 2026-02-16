const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let players = {};

io.on('connection', (socket) => {
    console.log('Người chơi mới kết nối: ' + socket.id);

    // Tạo dữ liệu cho người chơi mới
    players[socket.id] = {
        x: 0,
        z: 0,
        rotation: 0,
        model: Math.random() > 0.5 ? 'boy' : 'girl' // Ngẫu nhiên chọn nhân vật
    };

    // Gửi danh sách người chơi hiện tại cho người mới vào
    socket.emit('currentPlayers', players);

    // Thông báo cho những người khác có người mới vào
    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    // Cập nhật vị trí khi người chơi di chuyển
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].z = movementData.z;
            players[socket.id].rotation = movementData.rotation;
            // Phát tán vị trí mới cho tất cả mọi người (trừ người gửi)
            socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
        }
    });

    // Xử lý khi thoát
    socket.on('disconnect', () => {
        console.log('Người chơi thoát: ' + socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});