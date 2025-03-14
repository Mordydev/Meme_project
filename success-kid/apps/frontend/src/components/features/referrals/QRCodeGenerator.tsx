'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

// Mock QR code URL generator for demo purposes
// In a real implementation, this would use a QR code generation library
const getQRCodeURL = (text: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

interface QRCodeGeneratorProps {
  referralLink: string;
  className?: string;
}

export function QRCodeGenerator({ referralLink, className }: QRCodeGeneratorProps) {
  // Generate QR code URL
  const qrCodeUrl = getQRCodeURL(referralLink);
  
  // Handle download QR code
  const handleDownload = () => {
    // Create anchor element and trigger download
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'success-kid-referral-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'QR Code Downloaded',
      description: 'Your referral QR code has been downloaded',
      variant: 'success',
    });
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Referral QR Code</CardTitle>
        <CardDescription>Share this QR code to let others scan and join with your referral</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="overflow-hidden rounded-md border p-2">
          {/* QR Code Image */}
          <img 
            src={qrCodeUrl} 
            alt="Referral QR Code" 
            className="h-48 w-48"
          />
        </div>
        
        <Button
          onClick={handleDownload}
          variant="outline"
        >
          Download QR Code
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">
          Scanning this code will take users directly to registration with your referral code applied.
        </p>
      </CardContent>
    </Card>
  );
}
