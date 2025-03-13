export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Dashboard header skeleton */}
      <div>
        <div className="h-8 w-1/4 bg-muted rounded-md animate-pulse mb-2"></div>
        <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
      </div>
      
      {/* Profile header skeleton */}
      <div className="rounded-lg p-6 border shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar skeleton */}
          <div className="h-32 w-32 rounded-full bg-muted animate-pulse"></div>
          
          <div className="flex-1 w-full">
            {/* User details skeleton */}
            <div className="space-y-3">
              <div className="h-7 w-1/3 bg-muted rounded-md animate-pulse"></div>
              <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse"></div>
              <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-5 gap-4 mt-6 px-2 py-4 bg-muted rounded-md">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-3 w-16 bg-muted-foreground/10 rounded-md animate-pulse"></div>
              <div className="h-5 w-10 bg-muted-foreground/20 rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tab skeleton */}
      <div className="border rounded-lg p-1 flex space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-md animate-pulse"></div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse"></div>
                <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
