'use client';

import React, { useState } from 'react';
import { ConnectWalletButton } from '@/components/wallet/modal';
import { RedemptionWizard } from '@/components/features/redemption';
import { PointsNotificationSystem } from '@/components/features/points/notification';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function WalletDemoPage() {
  const [showPointsNotification, setShowPointsNotification] = useState(false);
  const [showRedemptionWizard, setShowRedemptionWizard] = useState(false);
  const { toast } = useToast();
  
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Wallet & Points Integration Demo</h1>
        
        <Tabs defaultValue="wallet" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallet">Wallet Connection</TabsTrigger>
            <TabsTrigger value="notifications">Points Notifications</TabsTrigger>
            <TabsTrigger value="redemption">Points Redemption</TabsTrigger>
          </TabsList>
          
          {/* Wallet Connection Tab */}
          <TabsContent value="wallet" className="p-4 border rounded-md mt-4">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
                <p className="text-neutral-600 mb-6">
                  Connect your wallet to access token features, view your balance, and redeem points.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <ConnectWalletButton />
                  <ConnectWalletButton variant="outline">Connect With Phantom</ConnectWalletButton>
                  <ConnectWalletButton showAddress showStatus variant="secondary" />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Implementation Details</h3>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  <li>Enhanced wallet connection modal with step-by-step guidance</li>
                  <li>Security-focused UI with clear explanations</li>
                  <li>Support for mobile wallet connections</li>
                  <li>Comprehensive error handling and recovery</li>
                  <li>Signature verification for wallet ownership proof</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          {/* Points Notifications Tab */}
          <TabsContent value="notifications" className="p-4 border rounded-md mt-4">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Points Notifications</h2>
                <p className="text-neutral-600 mb-6">
                  Real-time notifications for points earned with celebration effects for milestones.
                </p>
                
                <Button 
                  onClick={() => {
                    setShowPointsNotification(prev => !prev);
                    if (!showPointsNotification) {
                      toast({
                        title: "Points Notifications Enabled",
                        description: "Demo notifications will appear in a few seconds.",
                      });
                    }
                  }}
                >
                  {showPointsNotification ? "Disable" : "Enable"} Points Notifications
                </Button>
                
                {showPointsNotification && <PointsNotificationSystem />}
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Implementation Details</h3>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  <li>Real-time notification system with WebSocket integration</li>
                  <li>Toast-style notifications with progress indicators</li>
                  <li>Full-screen celebrations for major point milestones</li>
                  <li>Customizable notification position and duration</li>
                  <li>Accessibility features including reduced motion support</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          {/* Points Redemption Tab */}
          <TabsContent value="redemption" className="p-4 border rounded-md mt-4">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Points Redemption Flow</h2>
                <p className="text-neutral-600 mb-6">
                  Multi-step redemption process for converting Success Points to SKC tokens.
                </p>
                
                <Button onClick={() => setShowRedemptionWizard(prev => !prev)}>
                  {showRedemptionWizard ? "Hide" : "Show"} Redemption Wizard
                </Button>
                
                {showRedemptionWizard && (
                  <div className="mt-6">
                    <RedemptionWizard 
                      onSuccess={() => {
                        setShowRedemptionWizard(false);
                        toast({
                          title: "Redemption Complete",
                          description: "Demo redemption process completed successfully.",
                        });
                      }}
                      onClose={() => setShowRedemptionWizard(false)}
                    />
                  </div>
                )}
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Implementation Details</h3>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  <li>Step-by-step wizard interface with clear progress indicators</li>
                  <li>Eligibility checking with detailed requirements</li>
                  <li>Interactive amount selection with slider and direct input</li>
                  <li>Real-time conversion preview and confirmation</li>
                  <li>Transaction processing with status updates</li>
                  <li>Success confirmation with transaction details</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Implementation Summary</CardTitle>
            <CardDescription>
              Overview of the wallet integration and points system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">
              This implementation provides a complete solution for wallet connectivity and points-to-token
              conversion, creating a seamless bridge between on-platform engagement and blockchain value.
            </p>
            
            <div className="grid gap-4">
              <div>
                <h3 className="text-md font-medium mb-2">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                  <li>Intuitive wallet connection with step-by-step guidance</li>
                  <li>Secure message signing for wallet verification</li>
                  <li>Real-time points notification system with celebration effects</li>
                  <li>Multi-step redemption process with clear feedback</li>
                  <li>Comprehensive error handling and recovery</li>
                  <li>Fully responsive design for all device sizes</li>
                  <li>Accessibility features including reduced motion support</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Technical Implementation</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                  <li>React components with Typescript for type safety</li>
                  <li>State management with Zustand for global state</li>
                  <li>Animation with Framer Motion with accessibility options</li>
                  <li>Real-time updates with WebSocket integration</li>
                  <li>Secure wallet connectivity following best practices</li>
                  <li>Responsive design with mobile-first approach</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-neutral-500">
              These components implement the requirements specified in Task 7: Wallet Integration and Points System.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
