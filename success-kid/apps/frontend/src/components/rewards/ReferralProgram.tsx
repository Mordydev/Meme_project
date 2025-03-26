'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Sparkles, 
  LineChart, 
  QrCode, 
  Mail,
  Twitter,
  Facebook,
  Link,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useReferralStore, ReferredUser } from '@/store/useReferralStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ReferralProgramProps {
  referralCode: string;
  referralStats: any;
  isLoading: boolean;
}

export function ReferralProgram({ 
  referralCode = '', 
  referralStats, 
  isLoading 
}: ReferralProgramProps) {
  const { 
    referralLink,
    qrCodeUrl,
    statistics,
    referrals,
    fetchReferredUsers,
    trackReferralShare,
    error
  } = useReferralStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [referralFilter, setReferralFilter] = useState('all');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  // Generate mock QR code URL if not available
  const qrCodeImage = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink || 'https://success-kid.com/referral')}`;
  
  // Load referred users data
  useEffect(() => {
    if (activeTab === 'referrals') {
      fetchReferredUsers(referralFilter === 'all' ? undefined : referralFilter);
    }
  }, [activeTab, referralFilter, fetchReferredUsers]);
  
  // Generate mock referral data if not provided
  const generateMockReferrals = () => {
    if (referrals && referrals.length > 0) return referrals;
    
    const statuses: Array<'pending' | 'active' | 'converted'> = ['pending', 'active', 'converted'];
    const mockReferrals: ReferredUser[] = [];
    
    // Generate 15 random referred users
    for (let i = 1; i <= 15; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const daysAgo = Math.floor(Math.random() * 60);
      const registeredDate = new Date();
      registeredDate.setDate(registeredDate.getDate() - daysAgo);
      
      let convertedDate;
      if (status === 'converted' || status === 'active') {
        convertedDate = new Date(registeredDate);
        convertedDate.setDate(convertedDate.getDate() + Math.floor(Math.random() * 5) + 1);
      }
      
      let lastActive;
      if (status === 'active' || status === 'converted') {
        lastActive = new Date();
        lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 7));
      }
      
      mockReferrals.push({
        userId: `user-${i}`,
        username: `user${i}`,
        avatarUrl: `/avatars/avatar-${i % 10 + 1}.png`,
        registeredAt: registeredDate.toISOString(),
        convertedAt: convertedDate?.toISOString(),
        status,
        pointsGenerated: status === 'converted' ? 500 + Math.floor(Math.random() * 2000) : 0,
        lastActive: lastActive?.toISOString()
      });
    }
    
    return mockReferrals;
  };
  
  // Generate mock statistics if not provided
  const generateMockStatistics = () => {
    if (statistics) return statistics;
    
    return {
      totalReferrals: 15,
      convertedReferrals: 8,
      pendingReferrals: 4,
      conversionRate: 53,
      pointsEarned: 5840
    };
  };
  
  const referralData = generateMockReferrals();
  const referralStatistics = generateMockStatistics();
  
  // Filter referrals based on selected filter
  const filteredReferrals = referralFilter === 'all' 
    ? referralData 
    : referralData.filter(ref => ref.status === referralFilter);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time ago for display
  const timeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  };
  
  // Handle copy to clipboard
  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        toast({
          title: `${type === 'code' ? 'Referral code' : 'Referral link'} copied!`,
          description: `Ready to share with friends and earn rewards`,
          duration: 3000
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: 'Failed to copy',
          description: 'Please try again or select and copy manually',
          variant: 'destructive'
        });
      });
  };
  
  // Handle social sharing
  const handleShare = async (channel: string) => {
    // Track the share event
    trackReferralShare(channel);
    
    // Use Web Share API if available
    if (navigator.share && (channel === 'native' || channel === 'auto')) {
      try {
        await navigator.share({
          title: 'Join me on Success Kid Community',
          text: `I'm inviting you to join the Success Kid Community platform. Use my referral code ${referralCode} to earn 500 bonus points!`,
          url: referralLink
        });
        
        toast({
          title: 'Shared successfully!',
          description: 'Thanks for spreading the word about Success Kid',
        });
        return;
      } catch (err) {
        // Fall back to other methods if share API fails or is cancelled
        console.log('Error sharing:', err);
      }
    }
    
    // Handle specific channels
    switch (channel) {
      case 'email':
        window.location.href = `mailto:?subject=Join%20me%20on%20Success%20Kid%20Community&body=I'm%20inviting%20you%20to%20join%20the%20Success%20Kid%20Community%20platform.%20Use%20my%20referral%20code%20${referralCode}%20to%20earn%20500%20bonus%20points!%0A%0AJoin%20here:%20${encodeURIComponent(referralLink)}`;
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=I'm%20on%20Success%20Kid%20Community!%20Join%20me%20and%20earn%20500%20bonus%20points%20with%20my%20referral%20code%20${referralCode}&url=${encodeURIComponent(referralLink)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=I'm%20on%20Success%20Kid%20Community!%20Join%20me%20and%20earn%20500%20bonus%20points%20with%20my%20referral%20code%20${referralCode}}`, '_blank');
        break;
      default:
        copyToClipboard(referralLink, 'link');
        break;
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="share">Share & Invite</TabsTrigger>
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Code Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  <span>Your Referral Code</span>
                </CardTitle>
                <CardDescription>Share this code with friends to earn rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-lg" />
                ) : (
                  <div className="border border-dashed border-secondary rounded-lg bg-secondary-50 p-6 text-center">
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-secondary tracking-wider">
                      {referralCode || 'SUCCESSK1D'}
                    </div>
                    <div className="mt-2 text-sm text-secondary-800">
                      Both you and your friend earn 500 Success Points when they join
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        onClick={() => copyToClipboard(referralCode, 'code')}
                        className="flex items-center gap-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-neutral-600">Total Referrals</h4>
                    <div className="text-2xl font-bold mt-1">
                      {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : referralStatistics.totalReferrals}
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-neutral-600">Conversion Rate</h4>
                    <div className="text-2xl font-bold mt-1">
                      {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${referralStatistics.conversionRate}%`}
                    </div>
                  </Card>
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-neutral-600">Points Earned</h4>
                    <div className="text-2xl font-bold mt-1">
                      {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : referralStatistics.pointsEarned.toLocaleString()}
                    </div>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setActiveTab('share')}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Your Referral Link</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Referrals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Recent Referrals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : referralData.filter(ref => ref.status !== 'pending').length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto bg-neutral-100 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h4 className="font-medium">No active referrals yet</h4>
                    <p className="text-sm text-neutral-500 mt-1">Share your code to invite friends</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referralData
                      .filter(ref => ref.status !== 'pending')
                      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
                      .slice(0, 5)
                      .map((referral) => (
                        <div key={referral.userId} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                            {referral.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">@{referral.username}</div>
                            <div className="text-xs text-neutral-500">
                              Joined {formatDate(referral.registeredAt)}
                            </div>
                          </div>
                          <div className="ml-auto">
                            <div className={`text-xs px-2 py-1 rounded-full font-medium
                              ${referral.status === 'converted' ? 'bg-green-100 text-green-800' : ''}
                              ${referral.status === 'active' ? 'bg-blue-100 text-blue-800' : ''}
                            `}>
                              {referral.status === 'converted' ? 'Converted' : 'Active'}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    
                    <Button 
                      variant="link" 
                      className="w-full text-sm justify-center" 
                      onClick={() => setActiveTab('referrals')}
                    >
                      View all referrals
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* How Referrals Work */}
          <Card>
            <CardHeader>
              <CardTitle>How Referrals Work</CardTitle>
              <CardDescription>Learn how to earn rewards by referring friends to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12"
                variants={prefersReducedMotion ? {} : containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="flex flex-col items-center text-center"
                  variants={prefersReducedMotion ? {} : itemVariants}
                >
                  <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Share Your Code</h3>
                  <p className="text-neutral-600 text-sm">
                    Share your unique referral code or invite link with friends through email, social media, or directly
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center"
                  variants={prefersReducedMotion ? {} : itemVariants}
                >
                  <div className="h-12 w-12 rounded-full bg-secondary-50 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Friends Join</h3>
                  <p className="text-neutral-600 text-sm">
                    When your friends register using your code, they'll be linked to your account as referrals
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center"
                  variants={prefersReducedMotion ? {} : itemVariants}
                >
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Both Earn Rewards</h3>
                  <p className="text-neutral-600 text-sm">
                    You and your friend each earn 500 Success Points when they create an account and become active
                  </p>
                </motion.div>
              </motion.div>
              
              <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Important Notes</h4>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Referral rewards are only awarded once per referred user</li>
                      <li>• Your referral must use your code during registration</li>
                      <li>• Referral bonuses are credited after your friend completes account setup</li>
                      <li>• Terms and conditions apply to the referral program</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Share Tab */}
        <TabsContent value="share" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Share Link Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-primary" />
                  <span>Share Your Referral Link</span>
                </CardTitle>
                <CardDescription>Send this link to friends or share on social media</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  <Input
                    ref={linkInputRef}
                    value={referralLink || 'https://success-kid.com/referral/SUCCESSK1D'}
                    readOnly
                    className="font-mono text-sm pr-24"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(referralLink || 'https://success-kid.com/referral/SUCCESSK1D', 'link')}
                    className="ml-2 absolute right-5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Share via</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleShare('email')}
                    >
                      <Mail className="h-4 w-4 text-neutral-600" />
                      <span>Email</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleShare('twitter')}
                    >
                      <Twitter className="h-4 w-4 text-blue-500" />
                      <span>Twitter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleShare('facebook')}
                    >
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <span>Facebook</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleShare('native')}
                    >
                      <Share2 className="h-4 w-4 text-neutral-600" />
                      <span>More</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* QR Code */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <span>QR Code</span>
                </CardTitle>
                <CardDescription>Scan with a mobile device</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {isLoading ? (
                  <Skeleton className="h-48 w-48 rounded-lg" />
                ) : (
                  <>
                    <div className="border border-neutral-200 rounded-lg p-2 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrCodeImage} 
                        alt="Referral QR Code" 
                        width={200}
                        height={200}
                        className="h-48 w-48"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        // In a real implementation, this would download the QR code
                        const link = document.createElement('a');
                        link.href = qrCodeImage;
                        link.download = 'success-kid-referral-qr.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        toast({
                          title: 'QR Code downloaded',
                          description: 'Share this image to invite friends to join',
                        });
                      }}
                    >
                      Download QR Code
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Referral Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>Pre-written messages to share with your friends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <h3 className="font-medium mb-2">Personal Message</h3>
                  <div className="text-neutral-700 text-sm">
                    Hey! I'm using Success Kid Community platform and enjoying it. Use my referral code <span className="font-mono font-bold">{referralCode || 'SUCCESSK1D'}</span> when you sign up and we'll both get 500 bonus points! Join here: {referralLink || 'https://success-kid.com/referral/SUCCESSK1D'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => copyToClipboard(`Hey! I'm using Success Kid Community platform and enjoying it. Use my referral code ${referralCode || 'SUCCESSK1D'} when you sign up and we'll both get 500 bonus points! Join here: ${referralLink || 'https://success-kid.com/referral/SUCCESSK1D'}`, 'link')}
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    <span>Copy Message</span>
                  </Button>
                </div>
                
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <h3 className="font-medium mb-2">Social Media Post</h3>
                  <div className="text-neutral-700 text-sm">
                    I just joined the Success Kid Community platform! It's a great way to earn rewards while engaging with a fun community. Join me using my referral code <span className="font-mono font-bold">{referralCode || 'SUCCESSK1D'}</span> and we'll both get 500 bonus points! 🚀 #SuccessKid
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => copyToClipboard(`I just joined the Success Kid Community platform! It's a great way to earn rewards while engaging with a fun community. Join me using my referral code ${referralCode || 'SUCCESSK1D'} and we'll both get 500 bonus points! 🚀 #SuccessKid ${referralLink || 'https://success-kid.com/referral/SUCCESSK1D'}`, 'link')}
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    <span>Copy Message</span>
                  </Button>
                </div>
                
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <h3 className="font-medium mb-2">Email Template</h3>
                  <div className="text-neutral-700 text-sm">
                    <p>Subject: Join me on the Success Kid Community Platform</p>
                    <p className="mt-2">Hi there,</p>
                    <p className="mt-2">I wanted to invite you to check out the Success Kid Community Platform. It's a fun community with a rewards system where you can earn tokens for participating.</p>
                    <p className="mt-2">If you're interested, use my referral code <span className="font-mono font-bold">{referralCode || 'SUCCESSK1D'}</span> when signing up and we'll both get 500 bonus points to start with!</p>
                    <p className="mt-2">Join here: {referralLink || 'https://success-kid.com/referral/SUCCESSK1D'}</p>
                    <p className="mt-2">Hope to see you there!</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => handleShare('email')}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    <span>Send Email</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>My Referred Users</CardTitle>
                  <CardDescription>Track the status of your referrals</CardDescription>
                </div>
                
                <Tabs 
                  value={referralFilter} 
                  onValueChange={setReferralFilter}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                    <TabsTrigger value="all">
                      All
                      <span className="ml-1 text-xs rounded-full bg-neutral-100 px-1.5 py-0.5">
                        {referralData.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      <span className="ml-1 text-xs rounded-full bg-neutral-100 px-1.5 py-0.5">
                        {referralData.filter(r => r.status === 'pending').length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      Active
                      <span className="ml-1 text-xs rounded-full bg-neutral-100 px-1.5 py-0.5">
                        {referralData.filter(r => r.status === 'active').length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="converted">
                      Converted
                      <span className="ml-1 text-xs rounded-full bg-neutral-100 px-1.5 py-0.5">
                        {referralData.filter(r => r.status === 'converted').length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-neutral-100 pb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48 mt-1" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-auto mt-2 sm:mt-0">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto bg-neutral-100 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h4 className="font-medium">No {referralFilter !== 'all' ? referralFilter : ''} referrals found</h4>
                  <p className="text-sm text-neutral-500 mt-1">
                    {referralFilter !== 'all' 
                      ? `Try selecting a different filter or invite more friends`
                      : `Start sharing your referral code to invite friends`}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('share')}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Invite Friends
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredReferrals.map((referral) => (
                    <motion.div
                      key={referral.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 py-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                        {referral.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium flex items-center">
                          @{referral.username}
                          <div className={`ml-2 text-xs px-2 py-0.5 rounded-full
                            ${referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${referral.status === 'active' ? 'bg-blue-100 text-blue-800' : ''}
                            ${referral.status === 'converted' ? 'bg-green-100 text-green-800' : ''}
                          `}>
                            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                          </div>
                        </div>
                        <div className="text-sm text-neutral-500">
                          Registered: {formatDate(referral.registeredAt)}
                          {referral.lastActive && (
                            <span className="ml-3">Last active: {timeAgo(referral.lastActive)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                        {referral.status === 'converted' && (
                          <div className="bg-neutral-100 rounded px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-secondary" />
                            <span>{referral.pointsGenerated} points earned</span>
                          </div>
                        )}
                        
                        <Button variant="outline" size="sm" className="whitespace-nowrap">
                          <Mail className="h-4 w-4 mr-1" />
                          Send Reminder
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Referral Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span>Referral Analytics</span>
              </CardTitle>
              <CardDescription>Track the performance of your referral activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Referral Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-neutral-600">Total Referrals</div>
                      <div className="font-medium">{referralStatistics.totalReferrals}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-neutral-600">Converted Referrals</div>
                      <div className="font-medium">{referralStatistics.convertedReferrals}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-neutral-600">Pending Referrals</div>
                      <div className="font-medium">{referralStatistics.pendingReferrals}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-neutral-600">Conversion Rate</div>
                      <div className="font-medium">{referralStatistics.conversionRate}%</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-neutral-600">Total Points Earned</div>
                      <div className="font-medium">{referralStatistics.pointsEarned.toLocaleString()} SP</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Tips to Improve Conversions</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <div className="rounded-full h-5 w-5 bg-primary text-white flex items-center justify-center text-xs">1</div>
                      <div>Personalize your invitation messages for better response rates</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-full h-5 w-5 bg-primary text-white flex items-center justify-center text-xs">2</div>
                      <div>Follow up with pending referrals after a few days</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-full h-5 w-5 bg-primary text-white flex items-center justify-center text-xs">3</div>
                      <div>Highlight the 500 point bonus that both of you will receive</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-full h-5 w-5 bg-primary text-white flex items-center justify-center text-xs">4</div>
                      <div>Share specific features you've enjoyed about the platform</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-full h-5 w-5 bg-primary text-white flex items-center justify-center text-xs">5</div>
                      <div>Use the QR code for in-person referrals for immediate sign-ups</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
