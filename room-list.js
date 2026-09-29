const roomList = document.getElementById('roomList');
const refreshRoomsButton = document.getElementById('refreshRoomsBtn');
let roomListChannel;

function roomListStatus(message) {
    const status = document.getElementById('roomListStatus');
    if (status) status.textContent = message;
}

function renderRooms(rooms) {
    roomList.replaceChildren();
    if (!rooms.length) {
        roomListStatus('No open rooms yet. Create one to get started.');
        return;
    }
    roomListStatus(`${rooms.length} open room${rooms.length === 1 ? '' : 's'}`);
    rooms.forEach((room) => {
        const item = document.createElement('li');
        item.className = 'room-item';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'room-join-button';
        button.textContent = 'JOIN';
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = 'JOINING…';
            try {
                joinGame();
                document.getElementById('roomBox').value = room.id;
                await connectRoom();
            } finally {
                button.disabled = false;
                button.textContent = 'JOIN';
            }
        });
        const label = document.createElement('span');
        label.textContent = `Room ${room.id}`;
        item.append(label, button);
        roomList.appendChild(item);
    });
}

async function loadRooms() {
    roomListStatus('Loading open rooms…');
    const { data, error } = await db
        .from('si_rooms')
        .select('id, created_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) {
        roomListStatus('Could not load rooms. Try again.');
        return;
    }
    renderRooms(data || []);
}

refreshRoomsButton.addEventListener('click', loadRooms);
loadRooms();
roomListChannel = db.channel('si-room-list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'si_rooms' }, loadRooms)
    .subscribe();
setInterval(loadRooms, 30000);
