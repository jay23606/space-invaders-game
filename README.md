# Space Invaders Game

A browser Space Invaders game with optional two-player WebRTC co-op. Gameplay is peer-to-peer; Supabase stores short-lived room and WebRTC signaling records.

## Multiplayer

1. Player 1 clicks **CREATE ROOM** and shares the six-character room ID.
2. Player 2 clicks **JOIN ROOM**, enters the ID, and clicks **JOIN**.
3. Supabase Realtime delivers the offer/answer signaling messages.
4. The browsers establish a direct WebRTC data channel; Supabase is not involved in gameplay.

Rooms expire after 30 minutes. Signaling tables use the `si_` prefix and are protected by RLS.

## Development

The frontend is static and can be hosted on GitHub Pages. Supabase project configuration is embedded using the public project URL and publishable key. The publishable key is intended for browser use; no service-role key belongs in this repository.

## Live Demo

https://jay23606.github.io/space-invaders-game/
