import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Wild 'n Out Meme Coin - The Battles You Love, The Community You Belong To',
  description: 'Entertainment + Crypto + Community = Something you've never seen before. Join the Wild 'n Out meme coin platform today!',
  keywords: 'Wild 'n Out, meme coin, crypto, NFT, comedy, battles, entertainment, Nick Cannon, token, community',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Marketing Navigation */}
      <header className="w-full bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-battle-yellow text-xl font-display">WILD 'N OUT</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/about"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              About
            </Link>
            <Link 
              href="/features"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/battles"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Battles
            </Link>
            <Link 
              href="/creators"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Creators
            </Link>
            <Link 
              href="/token"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Token
            </Link>
            <Link 
              href="/faq"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="bg-transparent hover:bg-hype-white/10 text-hype-white border border-hype-white font-medium px-4 py-2 rounded-md text-sm md:text-base"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md text-sm md:text-base"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        {/* Mobile navigation menu - shown when menu button is clicked */}
        <div className="md:hidden container mx-auto px-4 pb-4 hidden" id="mobile-menu">
          <nav className="flex flex-col space-y-4">
            <Link 
              href="/about"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              About
            </Link>
            <Link 
              href="/features"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/battles"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Battles
            </Link>
            <Link 
              href="/creators"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Creators
            </Link>
            <Link 
              href="/token"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              Token
            </Link>
            <Link 
              href="/faq"
              className="text-zinc-300 hover:text-hype-white transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-zinc-900 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-display text-battle-yellow mb-4">WILD 'N OUT</h3>
              <p className="text-zinc-400">
                Community first. Entertainment always. Innovation constantly.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-hype-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/battles" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Battles
                  </Link>
                </li>
                <li>
                  <Link href="/creators" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Creators
                  </Link>
                </li>
                <li>
                  <Link href="/token" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Token
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-hype-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-zinc-400 hover:text-hype-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-zinc-400 hover:text-hype-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-hype-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-zinc-400 hover:text-hype-white transition-colors">
                    Disclaimers
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-zinc-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Wild 'n Out Meme Coin. All rights reserved.
            </div>
            
            <div className="flex space-x-6">
              <a href="#" aria-label="Twitter" className="text-zinc-400 hover:text-hype-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" aria-label="Discord" className="text-zinc-400 hover:text-hype-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Telegram" className="text-zinc-400 hover:text-hype-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0Zm.164 19.444a.991.991 0 0 1-1.053-1.035v-3.114h-1.39c-.434 0-.652-.303-.434-.695l.565-1.303a.488.488 0 0 1 .652-.262l.608.262v-2.116a3.793 3.793 0 0 1 3.746-3.79h1.69a.696.696 0 0 1 .696.696v1.997a.696.696 0 0 1-.696.696h-1.302c-.477 0-.868.39-.868.868v1.65h2.128a.54.54 0 0 1 .565.65l-.304 1.953a.54.54 0 0 1-.565.431h-1.824v3.114c0 .694-.523 1.388-1.214 1.998Z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
