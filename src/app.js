import {
  HMSReactiveStore,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectLocalPeerRole,
} from '@100mslive/hms-video-store';
import { getToken, createElem } from './utils';

const hms = new HMSReactiveStore();
const hmsStore = hms.getStore();
const hmsActions = hms.getActions();

// Get DOM elements
const Form = document.querySelector('#join-form');
const FormView = document.querySelector('#join-section');
const RoomView = document.querySelector('#room-section');
const PeersContainer = document.querySelector('#peers-container');
const LeaveRoomBtn = document.querySelector('#leave-room-btn');
const AudioBtn = document.querySelector('#audio-btn');
const JoinBtn = document.querySelector('#join-btn');

Form.addEventListener('submit', async (e) => {
  // prevents form reload
  e.preventDefault();
  // get input fields
  const userName = Form.elements.username.value; // by name
  const role = Form.elements.roles.value; // by name
  // simple validation
  if (!userName) return; // makes sure user enters a username
  JoinBtn.innerHTML = 'Loading...';
  try {
    // gets token
    const authToken = await getToken(hmsActions, role);
    // joins rooms
    await hmsActions.join({
      userName,
      authToken,
      settings: {
        isAudioMuted: true,
      },
    });
  } catch (error) {
    // handle error
    JoinBtn.innerHTML = 'Join';
    console.log('Token API Error', error);
  }
});

// handle join room view
function handleConnection(isConnected) {
  // get local peer role.
  const role = hmsStore.getState(selectLocalPeerRole);

  if (isConnected) {
    console.log('connected');

    // hides mute btn for listner
    if (role.name === 'listener') {
      AudioBtn.classList.add('hidden');
    }

    // hides Form
    FormView.classList.toggle('hidden');
    // displays room
    RoomView.classList.toggle('hidden');
  } else {
    console.log('disconnected');
    // hides Form
    FormView.classList.toggle('hidden');
    // displays room
    RoomView.classList.toggle('hidden');
  }
}
// subscribe to room state
hmsStore.subscribe(handleConnection, selectIsConnectedToRoom);

function leaveRoom() {
  hmsActions.leave();
  JoinBtn.innerHTML = 'Join';
}
LeaveRoomBtn.addEventListener('click', leaveRoom);
window.onunload = leaveRoom;

function renderPeers(peers) {
  let peerList = peers;
  PeersContainer.innerHTML = ''; // clears the container
  if (!peers) {
    // this allows us to make peer list an optional argument
    peerList = hmsStore.getState(selectPeers);
  }
  peerList.forEach((peer) => {
    // creates an image tag
    const peerAvatar = createElem('img', {
      class: 'object-center object-cover w-full',
      src: `https://source.boringavatars.com/marble/120/${peer.name}`,
      alt: 'photo',
    });
    // create a description paragraph tag with a text
    const peerDesc = createElem(
      'p',
      {
        class: 'text-white font-bold whitespace-nowrap text-ellipsis overflow-hidden',
      },
      `${peer.name}${peer.isLocal ? ' (You)' : ''} - ${peer.roleName} `,
    );
    // add mute/unmute list items
    const MuteItem = createElem(
      'li',
      { id: 'mute', class: 'cursor-pointer' },
      createElem(
        'span',
        {
          'data-id': peer.id,
          'data-islocal': peer.isLocal,
          class: 'mute rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block',
        },
        'Unmute',
      ),
    );
    const SpeakerItem = createElem(
      'li',
      { id: 'speaker', class: 'cursor-pointer' },
      createElem(
        'span',
        {
          'data-id': peer.id,
          class: 'speaker bg-gray-200 hover:bg-gray-400 py-2 px-4 block',
        },
        'Make speaker',
      ),
    );
    const ListenerItem = createElem(
      'li',
      { id: 'listener', class: 'cursor-pointer' },
      createElem(
        'span',
        {
          'data-id': peer.id,
          class: 'listener rounded-b bg-gray-200 hover:bg-gray-400 py-2 px-4 block',
        },
        'Make listener',
      ),
    );
    const menu = createElem(
      'button',
      { class: 'text-white font-bold text-3xl z-20 rounded inline-flex items-center' },
      '...',
    );
    const dropdown = createElem(
      'ul',
      { class: 'dropdown-menu absolute top-4 right-0 hidden text-gray-700 w-max pt-1 group-hover:block z-50' },
      MuteItem,
      SpeakerItem,
      ListenerItem,
    );
    const menuContainer = createElem(
      'div',
      {
        class: `${peer.isLocal && peer.roleName === 'listener'
          ? 'hidden'
          : ''} dropdown inline-block absolute top-0 right-8`,
      },
      menu,
      dropdown,
    );
    const peerContainer = createElem(
      'div',
      {
        class:
                    'relative w-full p-4 rounded-lg sahdow-lg overflow-hidden flex flex-col justify-center items-center',
      },
      menuContainer,
      peerAvatar,
      peerDesc,
    );
    // appends children
    PeersContainer.append(peerContainer);
  });
}
hmsStore.subscribe(renderPeers, selectPeers);

AudioBtn?.addEventListener('click', () => {
  const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
  AudioBtn.innerText = audioEnabled ? 'Mute' : 'Unmute';
  AudioBtn.classList.toggle('bg-green-600');
  AudioBtn.classList.toggle('bg-red-600');
  hmsActions.setLocalAudioEnabled(audioEnabled);
});

document.addEventListener(
  'click',
  (event) => {
    const role = hmsStore.getState(selectLocalPeerRole);
    // handle mute/unmute
    if (event.target.matches('.mute')) {
      if (role.name === 'listener') {
        alert('You do not have the permission to mute/unmute!');
        return;
      }
      if (
        role.name === 'speaker'
                && JSON.parse(event.target.dataset.islocal) === false) {
        alert(
          'You do not have the permission to mute/unmute other peers!',
        );
        return;
      }
      const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
      hmsActions.setLocalAudioEnabled(audioEnabled);
      event.target.innerText = audioEnabled ? 'Mute' : 'unmute';
    }

    // handle change role
    if (event.target.matches('.speaker')) {
      if (!role.permissions.changeRole) {
        alert('You do not have the permission to change role!');
        return;
      }
      hmsActions.changeRoleOfPeer(event.target.dataset.id, 'speaker', true);
    }

    if (event.target.matches('.listener')) {
      if (!role.permissions.changeRole) {
        alert('You do not have the permission to change role!');
        return;
      }
      hmsActions.changeRoleOfPeer(event.target.dataset.id, 'listener', true);
    }
  },
  false,
);
