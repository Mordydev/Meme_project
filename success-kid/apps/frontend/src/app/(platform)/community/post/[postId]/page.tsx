import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = params;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/community">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            Back to Community
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Post Detail</h1>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="p-12 border border-dashed rounded-md text-center">
            <h3 className="text-lg font-medium text-muted-foreground">
              Post Detail View Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              The complete post detail experience will be implemented in the next development phase
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Post ID: {postId}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
