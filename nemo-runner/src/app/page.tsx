import Link from 'next/link';
import styles from '@/styles/Home.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>NEMO Runner</h1>
        <p className={styles.description}>
          Dive into an underwater adventure
        </p>
        <div className={styles.actions}>
          <Link href="/game" className={styles.playButton}>
            Play Now
          </Link>
          <Link href="/leaderboard" className={styles.leaderboardButton}>
            Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}