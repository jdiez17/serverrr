import pty from 'pty.js';
import express from 'express';
import io from 'socket.io';
import term from 'term.js';
import http from 'http';

var app = express();
var srv = http.Server(app);
var sio = null;
var cid = null;
var state = "init";

function setupHandlers() {
    sio.sockets.on('connection', (socket) => {
        // TODO: args (cols, rows)
        var terminal = pty.spawn("bash", [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
        });

        state = "connected";
        terminal.on('data', (data) => { socket.emit('out', data); });
        socket.on('in', (data) => { terminal.write(data); });

        terminal.on('close', () => {
            staet = "disconnected";
            console.log("Terminal closed!");
            socket.emit("kill");
        });

        socket.on('disconnect', () => {
            state = "disconnected";
            console.log("Disconnect!");
            terminal.destroy();
        });
    });

    state = "ready";
}

app.get("/control/state/:id", (req, res) => {
    if(!cid && req.params.id != null) {
        cid = req.params.id;
        if(cid != null) {
            sio = io(srv, {resource: "/proxy/" + cid + "/socket.io"});
            setupHandlers();

            console.log(cid);
        }
    }

    res.send(state);
});

srv.listen(8081);
console.log("Server starting!");
