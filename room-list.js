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
        const info = document.createElement('span');
        info.className = 'room-info';
        const name = document.createElement('strong');
        name.textContent = room.name || 'Unnamed mission';
        const meta = document.createElement('small');
        meta.textContent = 'Waiting for a co-pilot';
        info.append(name, meta);
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
        item.append(info, button);
        roomList.appendChild(item);
    });
}

async function loadRooms() {
    roomListStatus('Loading open rooms…');
    const cutoff = new Date(Date.now() - 90000).toISOString();
    const { data, error } = await db.from('si_rooms')
        .select('id, name, created_at, last_seen_at')
        .gt('expires_at', new Date().toISOString())
        .gt('last_seen_at', cutoff)
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
setInterval(loadRooms, 15000);
