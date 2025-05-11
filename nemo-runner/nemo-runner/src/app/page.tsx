import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to NEMO Underwater Runner!</h1>
      <Link href="/play" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
        Play Game
      </Link>
    </main>
  );
}
