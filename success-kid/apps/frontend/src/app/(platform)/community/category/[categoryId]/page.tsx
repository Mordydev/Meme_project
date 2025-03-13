import { CategoryHeader, FeedContainer, CreatePostButton } from '@/components/features/community';

interface CategoryPageProps {
  params: {
    categoryId: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = params;
  
  return (
    <div className="space-y-6">
      {/* Category header with back button */}
      <div className="flex justify-between items-start gap-4">
        <CategoryHeader categoryId={categoryId} className="flex-1" />
        <CreatePostButton categoryId={categoryId} />
      </div>
      
      {/* Feed for this category */}
      <FeedContainer 
        initialCategoryId={categoryId}
        initialFeedType="latest"
      />
    </div>
  );
}
