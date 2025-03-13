import { WalletManager } from '@/components/wallet';

export const metadata = {
  title: 'Wallet - Success Kid Community',
  description: 'Manage your cryptocurrency wallet, track your tokens, and view your transaction history.',
};

export default function WalletPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Your Wallet</h1>
        <p className="text-gray-600">
          Connect your wallet to track your tokens, enable redemptions, and access exclusive holder features.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-1">
        <WalletManager />
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Wallet Benefits</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Redeem Points for Tokens</h3>
                <p className="text-gray-600">Convert your earned Success Points into SKC tokens directly to your wallet.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Exclusive Holder Features</h3>
                <p className="text-gray-600">Access special content, features, and opportunities available only to token holders.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-4a1 1 0 011-1 5 5 0 0010 0 1 1 0 112 0 7 7 0 11-14 0 1 1 0 011 1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Community Governance</h3>
                <p className="text-gray-600">Participate in community governance decisions that shape the platform's future.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Wallet Security</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              We take your wallet security seriously. Here's how we keep your assets safe:
            </p>
            
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Never Store Private Keys</h3>
                <p className="text-gray-600">We never access or store your private keys. You maintain complete control over your assets.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2h2v2h2v-2h2v-2h2v-2h2l2-2-8.414-8.414A6 6 0 1118 8zm-6-4a1 1 0 10-2 0 1 1 0 002 0zM4 8a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Signature-Based Verification</h3>
                <p className="text-gray-600">We use cryptographic signatures to verify wallet ownership without requiring transfer approval.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Limited Permissions</h3>
                <p className="text-gray-600">We request only the minimum permissions needed to verify your wallet and display your balance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
