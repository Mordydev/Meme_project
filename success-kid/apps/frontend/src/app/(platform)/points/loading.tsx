import { Spinner } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-display-md mb-6 font-display">Success Points Dashboard</h1>
      
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading your points dashboard...</p>
      </div>
    </div>
  );
}
