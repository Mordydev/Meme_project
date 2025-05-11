import GameCanvas from '@/components/game/GameCanvas'; // Adjust path if your alias is different

export default function GamePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <GameCanvas />
    </main>
  );
} 