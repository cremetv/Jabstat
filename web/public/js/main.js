const socket = io();

$('#submit').on('click', function(e) {
  e.preventDefault();
  let password = $('#password').val();
  console.log(`sending ${password} as password`);
  socket.emit('verify', {pw: password});
});
