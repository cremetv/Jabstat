const socket = io();

$('#submit').on('click', function(e) {
  e.preventDefault();
  let password = $('#password').val();
  console.log(`sending ${password} as password`);
  socket.emit('verify', {pw: password});
});

const chat = $('#chat');
const scrollMessages = () => {
  let scrollHeight = chat[0].scrollHeight;
  TweenLite.to(chat, 2, {
		scrollTo: scrollHeight,
		ease:Power2.easeOut
	});
}

$(document).ready(function() {
  scrollMessages();
  console.log('ready scroll!');
});
