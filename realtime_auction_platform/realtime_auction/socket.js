const SocketIO = require('socket.io');

module.exports = (server, app) => {
  const io = SocketIO(server, { path: '/socket.io' });

  app.set('io', io);

  io.on('connection', (socket) => {
    const req = socket.request;
    const { headers: { referer } } = req;
    const roomId = referer.split('/')[referer.split('/').length - 1];
    socket.join(roomId);
    socket.on('disconnect', () => {
      socket.leave(roomId);
    });
    //서버 시간 전송
    const interval = setInterval(() => {
      socket.emit('timecount', new Date().valueOf().toString() );
    }, 1000);

    socket.on('finishTime', () => {
        clearInterval(interval);
      });
  });
  
};
