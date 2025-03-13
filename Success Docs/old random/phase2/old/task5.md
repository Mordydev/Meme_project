# Task 5: Forum and Content System

## Task Overview
Implement the core community discussion platform that enables users to create, view, and engage with content across various categories. This feature forms the central social hub of the Success Kid Community Platform, fostering meaningful interactions and content creation that embodies the community's values of positivity and achievement.

## Required Document Review
- **Masterplan Document** - Sections 4.1 (Discussion Forums) and 4.2 (Content Creation Tools)
- **Design System Document** - Sections 4.2 (UX Writing Patterns) and 8.4 (Data Display Patterns)
- **App Flow Document** - Section 4.4 (Content Creation & Posting)
- **Frontend & Backend Guidelines** - Section 4.1 (Frontend Component Patterns) for content display

## User Experience Flow
1. **Category Selection:** User browses and selects content categories of interest
2. **Content Discovery:** User views posts in feed or list format with engagement metrics
3. **Content Viewing:** User reads full post with media and community engagement
4. **Comment Interaction:** User views and creates threaded comments on content
5. **Content Creation:** User creates new posts with text, media and formatting options
6. **Voting & Engagement:** User upvotes/downvotes content and tracks engagement
7. **Moderation:** System and user-based content filtering maintains community standards

## Implementation Sub-Tasks

### Sub-Task 1: Category Browser Component
**Description:** Create the category navigation and selection component that helps users discover and filter content by topic areas.

**Component Hierarchy:**
```
CategoryBrowser/
├── CategoryList/          # Main category navigation
│   └── CategoryItem       # Individual category with stats
├── CategoryHeader/        # Current category information
│   ├── CategoryIcon       # Visual representation
│   ├── CategoryStats      # Activity metrics
│   └── SubscribeButton    # Follow/unfollow control
└── SubcategoryTabs/       # Sub-topic navigation
```

**Key Interface/Props:**
```tsx
interface CategoryBrowserProps {
  categories: Category[];
  activeCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  layout?: 'horizontal' | 'vertical';
}

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  iconUrl: string;
  color: string;
  stats: {
    posts: number;
    activeNow: number;
  };
  isSubscribed?: boolean;
  subcategories?: Subcategory[];
}
```

**Key UI Elements:**
```tsx
function CategoryList({ categories, activeCategoryId, onSelectCategory, layout = 'vertical' }: CategoryBrowserProps) {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div className={`${isHorizontal ? 'flex overflow-x-auto py-2' : 'space-y-1'}`}>
      {categories.map(category => (
        <CategoryItem
          key={category.id}
          category={category}
          isActive={category.id === activeCategoryId}
          onClick={() => onSelectCategory(category.id)}
          layout={layout}
        />
      ))}
    </div>
  );
}

function CategoryHeader({ category, onSubscribe }: CategoryHeaderProps) {
  if (!category) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <img src={category.iconUrl} alt="" className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-semibold text-gray-900">{category.name}</h1>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => onSubscribe(category.id, !category.isSubscribed)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md 
              ${category.isSubscribed 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-primary text-white hover:bg-primary-dark'}
            `}
          >
            {category.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
        <div>
          <span className="font-medium text-gray-900">{category.stats.posts.toLocaleString()}</span> posts
        </div>
        {category.stats.activeNow > 0 && (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-success mr-1" />
            <span className="font-medium text-gray-900">{category.stats.activeNow}</span> active now
          </div>
        )}
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Use consistent iconography for categories
  - Provide activity metrics for category selection guidance
  - Implement both horizontal and vertical layouts for different contexts
  - Cache category data for improved performance
  - Highlight active category clearly
  - Support keyboard navigation for accessibility

- **Potential Challenges:**
  - Handling many categories while maintaining usability
  - Creating visually distinct but cohesive category identities
  - Ensuring smooth scrolling for horizontal category lists on mobile
  - Managing subcategory relationships clearly

### Sub-Task 2: Post List Component
**Description:** Create the post list/feed component that displays content items in a scrollable, engaging format with appropriate sorting and filtering options.

**Component Hierarchy:**
```
PostList/
├── ListControls/          # Sorting and filtering options
│   ├── SortSelector       # Sort order dropdown
│   └── FilterOptions      # Additional filter controls
├── PostCard/              # Individual post preview
│   ├── PostHeader         # Author and metadata
│   ├── PostContent        # Truncated content preview
│   ├── PostMedia          # Featured media preview
│   └── PostEngagement     # Vote and comment counters
└── ListPagination/        # Load more / pagination controls
```

**Key Interface/Props:**
```tsx
interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSortChange?: (sort: SortOption) => void;
  onPostClick?: (postId: string) => void;
  onVote?: (postId: string, direction: 'up' | 'down') => void;
  sortOption?: SortOption;
  layout?: 'card' | 'compact';
}

interface Post {
  id: string;
  title: string;
  content: string;
  contentPreview: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    level: number;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt?: string;
  mediaUrls?: string[];
  mediaCount?: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: 'up' | 'down' | null;
  isPinned?: boolean;
}
```

**Key UI Elements:**
```tsx
function PostCard({ post, onClick, onVote, layout = 'card' }: PostCardProps) {
  const isCardLayout = layout === 'card';
  const formattedDate = formatRelativeTime(post.createdAt);
  
  const handleVote = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onVote) {
      onVote(post.id, direction);
    }
  };
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm overflow-hidden
        hover:shadow-md transition cursor-pointer
        ${post.isPinned ? 'border-l-4 border-primary' : ''}
      `}
      onClick={onClick}
    >
      <div className={`p-4 ${isCardLayout ? '' : 'flex'}`}>
        {/* Author and metadata */}
        <div className="flex items-center">
          <img 
            src={post.author.avatarUrl} 
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <div className="ml-2 flex-1">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">{post.author.displayName}</span>
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
                Lvl {post.author.level}
              </span>
              <span className="mx-1.5 text-gray-500">&middot;</span>
              <span className="text-gray-500">{formattedDate}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span 
                className="px-2 py-0.5 rounded-md mr-1" 
                style={{ 
                  backgroundColor: `${post.category.color}15`, 
                  color: post.category.color 
                }}
              >
                {post.category.name}
              </span>
              {post.isPinned && (
                <span className="flex items-center text-primary ml-1">
                  <PinIcon className="w-3 h-3 mr-0.5" />
                  Pinned
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className={`${isCardLayout ? 'mt-3' : 'ml-4 flex-1'}`}>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {post.title}
          </h3>
          <p className="mt-1 text-gray-600 line-clamp-2">
            {post.contentPreview}
          </p>
          
          {/* Media preview - only shown in card layout */}
          {isCardLayout && post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 relative">
              <img 
                src={post.mediaUrls[0]} 
                alt=""
                className="rounded-md w-full h-48 object-cover"
              />
              {post.mediaUrls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white rounded-md px-2 py-1 text-xs">
                  +{post.mediaUrls.length - 1} more
                </div>
              )}
            </div>
          )}
          
          {/* Engagement metrics */}
          <div className="mt-3 flex items-center text-sm text-gray-500">
            {/* Voting */}
            <div className="flex items-center mr-4">
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${post.userVote === 'up' ? 'text-success' : ''}`}
                onClick={(e) => handleVote(e, 'up')}
                aria-label="Upvote"
              >
                <ArrowUpIcon className="w-5 h-5" />
              </button>
              <span className="mx-1 min-w-[20px] text-center">
                {(post.upvotes - post.downvotes).toLocaleString()}
              </span>
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${post.userVote === 'down' ? 'text-error' : ''}`}
                onClick={(e) => handleVote(e, 'down')}
                aria-label="Downvote"
              >
                <ArrowDownIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Comments */}
            <div className="flex items-center">
              <ChatIcon className="w-5 h-5 mr-1" />
              <span>{post.commentCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Provide clear sorting options for content discovery
  - Implement both card and compact layouts for different contexts
  - Show appropriate loading states during data fetching
  - Include empty state guidance when no posts are available
  - Optimize media loading for performance
  - Implement proper content truncation for previews
  - Show clear visual indicators for upvoted/downvoted content

- **Potential Challenges:**
  - Handling various content types consistently
  - Efficiently loading images and media previews
  - Managing long vs. short content previews
  - Supporting multiple interaction types without UI clutter

### Sub-Task 3: Post Detail Component
**Description:** Create the post detail view that displays the complete content with media and interactive elements for community engagement.

**Component Hierarchy:**
```
PostDetail/
├── PostHeader/            # Complete post metadata
│   ├── AuthorInfo         # Author profile snippet
│   ├── CategoryBadge      # Category indicator
│   └── PostMetadata       # Timestamp and status
├── PostContent/           # Full content display
│   ├── PostBody           # Formatted text content
│   └── MediaGallery       # Multi-image gallery
├── PostActions/           # Interactive controls
│   ├── VoteControls       # Upvote/downvote buttons
│   └── ShareOptions       # Sharing functionality
└── CommentSection/        # Comment thread container
```

**Key Interface/Props:**
```tsx
interface PostDetailProps {
  post: PostDetails;
  isLoading?: boolean;
  onVote?: (direction: 'up' | 'down') => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

interface PostDetails extends Post {
  content: string; // Full content, not just preview
  media: {
    url: string;
    type: 'image' | 'video' | 'link';
    width?: number;
    height?: number;
    thumbnailUrl?: string;
  }[];
  tags?: string[];
  isEdited?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}
```

**Key UI Elements:**
```tsx
function PostDetail({ post, isLoading, onVote, onShare, onEdit, onDelete, onReport }: PostDetailProps) {
  if (isLoading) {
    return <PostDetailSkeleton />;
  }
  
  if (!post) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Post not found</h3>
        <p className="mt-2 text-gray-500">
          This post may have been removed or you may not have permission to view it.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <img 
              src={post.author.avatarUrl} 
              alt=""
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{post.author.displayName}</span>
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
                  Lvl {post.author.level}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <span>{formatDate(post.createdAt)}</span>
                {post.isEdited && (
                  <>
                    <span className="mx-1">&middot;</span>
                    <span>Edited</span>
                  </>
                )}
                <span className="mx-1">&middot;</span>
                <span
                  className="px-2 py-0.5 rounded-md text-xs" 
                  style={{ 
                    backgroundColor: `${post.category.color}15`, 
                    color: post.category.color 
                  }}
                >
                  {post.category.name}
                </span>
              </div>
            </div>
          </div>
          
          {/* Post actions dropdown */}
          <Menu>
            <Menu.Button className="p-1 rounded-md hover:bg-gray-100">
              <DotsVerticalIcon className="w-5 h-5 text-gray-500" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {post.canEdit && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onEdit}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                      >
                        Edit Post
                      </button>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onShare}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                    >
                      Share Post
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onReport}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 block w-full text-left px-4 py-2 text-sm`}
                    >
                      Report Post
                    </button>
                  )}
                </Menu.Item>
                {post.canDelete && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDelete}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } text-error block w-full text-left px-4 py-2 text-sm`}
                      >
                        Delete Post
                      </button>
                    )}
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Menu>
        </div>
        
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {post.title}
        </h1>
      </div>
      
      {/* Post Content and Media */}
      <div className="p-6">
        <div className="prose prose-primary max-w-none">
          <RichTextRenderer content={post.content} />
        </div>
        
        {post.media && post.media.length > 0 && (
          <div className="mt-6">
            <MediaGallery media={post.media} />
          </div>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="px-6 py-4 border-t border-b border-gray-200 flex items-center">
        {/* Vote controls */}
        <div className="flex items-center bg-gray-100 rounded-md">
          <button 
            className={`p-2 rounded-l-md hover:bg-gray-200 ${post.userVote === 'up' ? 'text-success' : ''}`}
            onClick={() => onVote && onVote('up')}
            aria-label="Upvote"
          >
            <ArrowUpIcon className="w-5 h-5" />
          </button>
          <span className="mx-2 font-medium text-gray-900 min-w-[30px] text-center">
            {(post.upvotes - post.downvotes).toLocaleString()}
          </span>
          <button 
            className={`p-2 rounded-r-md hover:bg-gray-200 ${post.userVote === 'down' ? 'text-error' : ''}`}
            onClick={() => onVote && onVote('down')}
            aria-label="Downvote"
          >
            <ArrowDownIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Share button */}
        <button 
          onClick={onShare}
          className="ml-4 flex items-center px-4 py-2 rounded-md hover:bg-gray-100"
        >
          <ShareIcon className="w-5 h-5 mr-1.5" />
          Share
        </button>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Format post content with proper typography and spacing
  - Implement responsive media gallery for different screen sizes
  - Provide contextual actions based on user permissions
  - Show clear attribution and metadata for content
  - Create appropriate sharing functionality
  - Ensure proper rendering of rich text content
  - Cache post data for improved performance

- **Potential Challenges:**
  - Handling different media types consistently
  - Supporting various rich text formatting features
  - Managing user permissions for edit/delete actions
  - Optimizing large media galleries for performance

### Sub-Task 4: Comment System
**Description:** Create the comment system that enables users to engage in threaded discussions about content.

**Component Hierarchy:**
```
CommentSection/
├── CommentHeader/         # Section header with count and sort
├── CommentEditor/         # New comment creation interface
├── CommentList/           # Hierarchical comment display
│   └── CommentItem/       # Individual comment component
│       ├── CommentHeader  # Author and metadata
│       ├── CommentContent # Comment text body
│       ├── CommentActions # Reply, vote, report controls
│       └── ReplyEditor    # Inline reply interface
└── CommentPagination/     # Load more controls
```

**Key Interface/Props:**
```tsx
interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  totalComments: number;
  isLoading?: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onVoteComment: (commentId: string, direction: 'up' | 'down') => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    level: number;
  };
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  isAuthor?: boolean;
  isEdited?: boolean;
  replies?: Comment[];
  replyCount?: number;
}
```

**Key UI Elements:**
```tsx
function CommentItem({ comment, onAddReply, onVote }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const formattedDate = formatRelativeTime(comment.createdAt);
  
  const handleReplySubmit = async (content: string) => {
    await onAddReply(content);
    setIsReplying(false);
  };
  
  return (
    <div className="p-6">
      {/* Comment header */}
      <div className="flex items-start">
        <img 
          src={comment.author.avatarUrl} 
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{comment.author.displayName}</span>
            {comment.isAuthor && (
              <span className="ml-2 text-xs bg-primary-light text-primary px-1.5 rounded-md">
                Author
              </span>
            )}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 rounded-md">
              Lvl {comment.author.level}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formattedDate}
            {comment.isEdited && (
              <span className="ml-1">(edited)</span>
            )}
          </div>
          
          {/* Comment content */}
          <div className="mt-2 text-gray-800">
            {comment.content}
          </div>
          
          {/* Comment actions */}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-4">
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${comment.userVote === 'up' ? 'text-success' : ''}`}
                onClick={() => onVote('up')}
                aria-label="Upvote"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
              <span className="mx-1">
                {(comment.upvotes - comment.downvotes).toLocaleString()}
              </span>
              <button 
                className={`p-1 rounded-md hover:bg-gray-100 ${comment.userVote === 'down' ? 'text-error' : ''}`}
                onClick={() => onVote('down')}
                aria-label="Downvote"
              >
                <ArrowDownIcon className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center mr-4 hover:text-gray-700"
            >
              <ReplyIcon className="w-4 h-4 mr-1" />
              Reply
            </button>
            
            <button className="flex items-center hover:text-gray-700">
              <FlagIcon className="w-4 h-4 mr-1" />
              Report
            </button>
          </div>
          
          {/* Reply editor */}
          {isReplying && (
            <div className="mt-3">
              <CommentEditor 
                onSubmit={handleReplySubmit}
                placeholder={`Reply to ${comment.author.displayName}...`}
              />
            </div>
          )}
          
          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onAddReply={onAddReply}
                  onVote={(direction) => onVote(reply.id, direction)}
                />
              ))}
            </div>
          )}
          
          {/* Show more replies link */}
          {comment.replyCount && comment.replyCount > (comment.replies?.length || 0) && (
            <button className="mt-2 text-sm text-primary hover:underline">
              Show {comment.replyCount - (comment.replies?.length || 0)} more {comment.replyCount - (comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement clear threaded comment structure
  - Provide inline reply functionality for conversations
  - Show comment author context (original poster, etc.)
  - Support pagination for large comment threads
  - Implement optimistic updates for better user experience
  - Create appropriate error handling for submission failures
  - Include moderation options for inappropriate content

- **Potential Challenges:**
  - Managing deeply nested comment threads
  - Balancing load performance with thread completeness
  - Handling complex reply interactions
  - Maintaining reply context for users

### Sub-Task 5: Content Creation Editor
**Description:** Implement the rich content creation interface that enables users to create formatted posts with media attachments.

**Component Hierarchy:**
```
ContentEditor/
├── EditorToolbar/         # Formatting controls
│   ├── TextControls       # Text formatting options
│   ├── ListControls       # List formatting options
│   └── MediaControls      # Media insertion tools
├── EditorContent/         # Main editing area
│   ├── TextEditor         # Rich text input area
│   └── MediaPreview       # Uploaded media display
├── EditorMetadata/        # Additional content fields
│   ├── TitleInput         # Post title field
│   ├── CategorySelect     # Category dropdown
│   └── TagInput           # Topic tags interface
└── PublishControls/       # Submission and draft options
```

**Key Interface/Props:**
```tsx
interface ContentEditorProps {
  initialData?: Partial<PostFormData>;
  categories: Category[];
  isEdit?: boolean;
  onSubmit: (data: PostFormData) => Promise<void>;
  onSaveDraft?: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

interface PostFormData {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  media?: File[];
  mediaToKeep?: string[]; // For edit mode, media URLs to retain
}
```

**Key UI Elements:**
```tsx
function ContentEditor({ 
  initialData = {}, 
  categories, 
  isEdit = false,
  onSubmit, 
  onSaveDraft,
  onCancel 
}: ContentEditorProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: initialData.title || '',
    content: initialData.content || '',
    categoryId: initialData.categoryId || '',
    tags: initialData.tags || [],
    media: [],
    mediaToKeep: initialData.mediaToKeep || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle rich text content changes
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    
    // Clear error for content
    if (errors.content) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };
  
  // Handle media uploads
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Generate preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      media: [...(prev.media || []), ...newFiles]
    }));
    
    setMediaPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to publish post', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to publish post. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className={`
              shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
              ${errors.title ? 'border-red-300' : ''}
            `}
            placeholder="Enter a descriptive title"
          />
        </div>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>
      
      {/* Category Selection */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <div className="mt-1">
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`
              shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md
              ${errors.categoryId ? 'border-red-300' : ''}
            `}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
        )}
      </div>
      
      {/* Content Editor */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <div className="mt-1">
          <RichTextEditor
            initialValue={formData.content}
            onChange={handleContentChange}
            error={!!errors.content}
          />
        </div>
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content}</p>
        )}
      </div>
      
      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Media (Optional)
        </label>
        <div className="mt-1 flex items-center">
          <label className="relative cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>Add Images</span>
            <input 
              type="file" 
              className="sr-only" 
              multiple 
              accept="image/*"
              onChange={handleMediaUpload}
            />
          </label>
          <p className="ml-3 text-xs text-gray-500">
            JPG, PNG, GIF up to 5MB each
          </p>
        </div>
        
        {/* Media Preview */}
        {(mediaPreviewUrls.length > 0 || (formData.mediaToKeep && formData.mediaToKeep.length > 0)) && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {mediaPreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt=""
                  className="h-24 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-1 right-1 bg-gray-900 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {formData.mediaToKeep?.map((url) => (
              <div key={url} className="relative">
                <img 
                  src={url} 
                  alt=""
                  className="h-24 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSavedMedia(url)}
                  className="absolute top-1 right-1 bg-gray-900 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tags Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tags (Optional)
        </label>
        <div className="mt-1">
          <TagsInput 
            value={formData.tags || []}
            onChange={tags => setFormData(prev => ({ ...prev, tags }))}
            placeholder="Add tags separated by comma"
            maxTags={5}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Add up to 5 tags to categorize your post
        </p>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || isSubmitting}
            className="px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary-50"
          >
            {isDraftSaving ? 'Saving...' : 'Save Draft'}
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
        >
          {isSubmitting ? 'Publishing...' : isEdit ? 'Update Post' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
```

**Implementation Considerations:**
- **Best Practices:**
  - Implement real-time validation with clear error messages
  - Provide media preview with removal option
  - Include draft saving functionality for content protection
  - Support rich text formatting for content expression
  - Implement proper form state management
  - Handle transitions between editing and viewing states
  - Include category selection for proper content organization

- **Potential Challenges:**
  - Rich text editor integration and customization
  - Media upload handling and optimization
  - Draft state persistence across sessions
  - Maintaining editor state during preview/edits

## Integration Points
- Connects with Authentication task for user identity in created content
- Interfaces with Navigation components for category browsing
- Provides content for Notification System on new posts/comments
- Feeds into Gamification System for content creation achievements
- Integrates with Media handling components for user uploads

## Testing Strategy
- Component testing of all content display and creation interfaces
- Form validation testing with various input scenarios
- Media upload and display testing
- Comment thread rendering with various depths
- Responsive testing across device sizes for layout adaptation
- Voting and interaction testing
- Performance testing with large content datasets

## Definition of Done
This task is complete when:
- [ ] Category browsing system enables intuitive content discovery
- [ ] Post list component displays content with proper engagement metrics
- [ ] Post detail view shows complete content with media handling
- [ ] Comment system enables threaded discussions with proper nesting
- [ ] Content editor allows rich text creation with media uploads
- [ ] Voting mechanisms work correctly for posts and comments
- [ ] All components adapt appropriately to different screen sizes
- [ ] Content state changes are properly reflected in real-time
- [ ] Loading, empty, and error states are properly handled
- [ ] Media uploads and previews work reliably
- [ ] Validation ensures quality content with appropriate feedback
- [ ] All components follow design system specifications