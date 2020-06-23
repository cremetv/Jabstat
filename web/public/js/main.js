const socket = io();

// $('#submit').on('click', function(e) {
//   e.preventDefault();
//   let password = $('#password').val();
//   console.log(`sending ${password} as password`);
//   socket.emit('verify', {pw: password});
// });

// const chat = $('#chat');
// const scrollMessages = () => {
//   let scrollHeight = chat[0].scrollHeight;
//   TweenLite.to(chat, 2, {
// 		scrollTo: scrollHeight,
// 		ease:Power2.easeOut
// 	});
// }
//
// $(document).ready(function() {
//   scrollMessages();
//   console.log('ready scroll!');
// });







// const sidebar = document.querySelector('.aside');

// const uuidv4 = () => {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//     let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }

// let userId = uuidv4(),
//     controllerId,
//     controllerLink;
//
// let url = new URL(window.location.href),
//     urlControllerId = url.searchParams.get('controller');
//
// console.log('url', url);
// console.log('urlControllerId', urlControllerId);

// /* if controllerId is not in url create one */
// if (urlControllerId == null) {
//   console.log('not in URL');
//   controllerId = uuidv4();
//   controllerLink = `${window.location.href}controller=${controllerId}`;
//
//   console.log('controllerId', controllerId);
//
//   let controllerEl = document.createElement('a');
//   controllerEl.innerHTML = controllerLink;
//   controllerEl.setAttribute('href', controllerLink);
//   controllerEl.setAttribute('target', '_blank');
//
//   sidebar.appendChild(controllerEl);
//
// } else {
//
// }



// const chatForm = document.querySelector('#chatForm'),
//       chat = document.querySelector('.chat'),
//       sendBtn = document.querySelector('#sendBtn'),
//       chatInput = document.querySelector('#chatInput');
//
//
// const sendMessage = () => {
//   let msg = chatInput.value;
//   socket.emit('chat message', {msg: msg, userId: userId, controllerId: urlControllerId});
//   chatInput.value = '';
// }
//
// sendBtn.addEventListener('click', function(e) {
//   e.preventDefault();
//   sendMessage();
// });
//
// chatForm.addEventListener('submit', function(e) {
//   e.preventDefault();
//   sendMessage();
// });
//
//
//
// socket.on('chat message', data => {
//   console.log('message from', data.userId);
//   console.log('controllerId from sender', data.controllerId);
//   let message = document.createElement('li');
//   message.innerHTML = data.msg;
//   if (data.controllerId === controllerId) message.classList.add('controlled');
//   chat.appendChild(message);
// });





const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const controllerDiv = document.querySelector('.controller');

let userId = uuidv4(),
    controllerId,
    controllerLink;

let url = new URL(window.location.href),
    urlControllerId = url.searchParams.get('controller');

/* if controllerId is not in url create one */
if (urlControllerId == null) {
  console.log('not in URL');
  controllerId = uuidv4();
  // controllerLink = `${window.location.href}controller=${controllerId}`;
  controllerLink = `http://localhost:3000/remoteControl?controller=${controllerId}`;

  console.log('controllerId', controllerId);

  let controllerEl = document.createElement('a');
  controllerEl.innerHTML = controllerLink;
  controllerEl.setAttribute('href', controllerLink);
  controllerEl.setAttribute('target', '_blank');

  controllerDiv.appendChild(controllerEl);

} else {

}


/* is controller */
if (urlControllerId != null) {
  let controls = {
    up: document.querySelector('.key--up'),
    right: document.querySelector('.key--right'),
    down: document.querySelector('.key--down'),
    left: document.querySelector('.key--left')
  }

  console.log('controls', controls);

  const controlEntries = Object.entries(controls);

  console.log('controlEntries', controlEntries);

  for (const [dir, el] of controlEntries) {
    console.log(el);
    el.addEventListener('mousedown', function(e) {
      e.preventDefault();

      console.log('mousedown', dir);

      socket.emit('keypress', {dir: dir, state: 'pressed', userId: userId, controllerId: urlControllerId});
    });

    el.addEventListener('mouseup', function(e) {
      e.preventDefault(e);

      console.log('mouseup', dir);

      socket.emit('keypress', {dir: dir, state: 'released', userId: userId, controllerId: urlControllerId});
    });
  }


} else {
/* is receiver */

const eventDisplay = document.querySelector('.event');

let moving = false,
    keyState = 'released';

const move = (dir, state = keyState) => {
  eventDisplay.innerHTML = dir;
  moving = (state == 'pressed') ? true : false;
  eventDisplay.style.color = 'black';

  console.log('moving?', moving);

  if (moving) {
    eventDisplay.style.color = 'crimson';
    // requestAnimationFrame(move(dir, state));
  }
}

  socket.on('move', data => {
    if (data.controllerId != controllerId) return;
    console.log('move command', data.dir);
    console.log('state', data.state);
    console.log('from', data.userId);
    console.log('controllerId', data.controllerId);

    eventDisplay.innerHTML = data.dir;
    move(data.dir, data.state);
  });
}
