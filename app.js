import pty from 'pty.js';
import express from 'express';
import io from 'socket.io';
import term from 'term.js';

var app = express();
var srv = app.listen(8081);
var sio = io.listen(srv);

app.use(term.middleware());

sio.sockets.on('connection', (socket) => {
    // TODO: args (cols, rows)
    var terminal = pty.spawn("bash", [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    terminal.on('data', (data) => { socket.emit('out', data); });
    socket.on('in', (data) => { terminal.write(data); });

    terminal.on('close', () => {
        console.log("Terminal closed!");
        socket.emit("kill");
    });

    socket.on('disconnect', () => {
        console.log("Disconnect!");
        terminal.destroy();
    });
});
