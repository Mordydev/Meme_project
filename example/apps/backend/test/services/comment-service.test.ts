import { CommentService, CommentCreateInput } from '../../src/services/comment-service';
import { TransactionManager } from '../../src/lib/transaction';
import { EventEmitter } from '../../src/lib/events';
import { AppError } from '../../src/lib/errors';

// Mocks
const mockCommentRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  getCommentThread: jest.fn(),
  getThreadedCommentsForContent: jest.fn(),
  getCommentsForContent: jest.fn(),
  findReplies: jest.fn()
};

const mockContentRepository = {
  findById: jest.fn(),
  incrementCommentCount: jest.fn(),
  decrementCommentCount: jest.fn()
};

const mockNotificationService = {
  createNotification: jest.fn()
};

const mockEventEmitter = {
  on: jest.fn(),
  emit: jest.fn()
};

const mockTransactionManager = {
  execute: jest.fn((fn) => fn())
};

describe('CommentService', () => {
  let commentService: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    commentService = new CommentService(
      mockCommentRepository as any,
      mockContentRepository as any,
      mockNotificationService as any,
      mockEventEmitter as unknown as EventEmitter,
      mockTransactionManager as unknown as TransactionManager
    );
  });

  describe('addComment()', () => {
    it('should create a new comment for content', async () => {
      // Setup
      const contentId = 'content1';
      const userId = 'user1';
      const data: CommentCreateInput = { body: 'Test comment' };
      const content = { id: contentId, status: 'published', creatorId: 'creator1' };
      const newComment = {
        id: 'comment1',
        contentId,
        userId,
        body: data.body,
        status: 'visible',
        createdAt: new Date()
      };
      
      mockContentRepository.findById.mockResolvedValue(content);
      mockCommentRepository.create.mockResolvedValue(newComment);
      
      // Execute
      const result = await commentService.addComment(contentId, userId, data);
      
      // Verify
      expect(mockContentRepository.findById).toHaveBeenCalledWith(contentId);
      expect(mockCommentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        contentId,
        userId,
        body: data.body,
        status: 'visible'
      }));
      expect(mockContentRepository.incrementCommentCount).toHaveBeenCalledWith(contentId);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toEqual(newComment);
    });

    it('should create a reply to an existing comment', async () => {
      // Setup
      const contentId = 'content1';
      const userId = 'user1';
      const parentId = 'comment1';
      const data: CommentCreateInput = { body: 'Test reply', parentId };
      const content = { id: contentId, status: 'published', creatorId: 'creator1' };
      const parentComment = { id: parentId, contentId, userId: 'user2' };
      const newComment = {
        id: 'comment2',
        contentId,
        userId,
        body: data.body,
        parentId,
        status: 'visible',
        createdAt: new Date()
      };
      
      mockContentRepository.findById.mockResolvedValue(content);
      mockCommentRepository.findById.mockResolvedValue(parentComment);
      mockCommentRepository.create.mockResolvedValue(newComment);
      
      // Execute
      const result = await commentService.addComment(contentId, userId, data);
      
      // Verify
      expect(mockContentRepository.findById).toHaveBeenCalledWith(contentId);
      expect(mockCommentRepository.findById).toHaveBeenCalledWith(parentId);
      expect(mockCommentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        contentId,
        userId,
        body: data.body,
        parentId,
        status: 'visible'
      }));
      expect(mockContentRepository.incrementCommentCount).toHaveBeenCalledWith(contentId);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toEqual(newComment);
    });

    it('should throw an error if content does not exist', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue(null);
      
      // Execute & Verify
      await expect(commentService.addComment(
        'nonexistent', 'user1', { body: 'Test' }
      )).rejects.toThrow();
    });

    it('should throw an error if content is not published', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue({ status: 'draft' });
      
      // Execute & Verify
      await expect(commentService.addComment(
        'content1', 'user1', { body: 'Test' }
      )).rejects.toThrow();
    });

    it('should throw an error if the parent comment does not exist', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue({ status: 'published' });
      mockCommentRepository.findById.mockResolvedValue(null);
      
      // Execute & Verify
      await expect(commentService.addComment(
        'content1', 'user1', { body: 'Test', parentId: 'nonexistent' }
      )).rejects.toThrow();
    });

    it('should throw an error if parent comment belongs to a different content', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue({ id: 'content1', status: 'published' });
      mockCommentRepository.findById.mockResolvedValue({ contentId: 'content2' });
      
      // Execute & Verify
      await expect(commentService.addComment(
        'content1', 'user1', { body: 'Test', parentId: 'comment1' }
      )).rejects.toThrow();
    });

    it('should throw an error if trying to create a deeply nested reply', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue({ id: 'content1', status: 'published' });
      mockCommentRepository.findById.mockResolvedValue({ contentId: 'content1', parentId: 'alreadyParent' });
      
      // Execute & Verify
      await expect(commentService.addComment(
        'content1', 'user1', { body: 'Test', parentId: 'comment1' }
      )).rejects.toThrow();
    });
  });

  describe('getCommentThread()', () => {
    it('should retrieve a comment thread with replies', async () => {
      // Setup
      const commentId = 'comment1';
      const rootComment = { id: commentId, body: 'Root comment' };
      const replies = [{ id: 'reply1', body: 'Reply 1' }];
      const threadResult = {
        rootComment,
        replies,
        meta: { total: 10, hasMore: true }
      };
      
      mockCommentRepository.getCommentThread.mockResolvedValue(threadResult);
      
      // Execute
      const result = await commentService.getCommentThread(commentId);
      
      // Verify
      expect(mockCommentRepository.getCommentThread).toHaveBeenCalledWith(commentId, {});
      expect(result).toEqual(threadResult);
    });

    it('should pass pagination options to the repository', async () => {
      // Setup
      const commentId = 'comment1';
      const options = { page: 1, limit: 5 };
      const threadResult = {
        rootComment: { id: commentId },
        replies: [],
        meta: { total: 10, hasMore: true }
      };
      
      mockCommentRepository.getCommentThread.mockResolvedValue(threadResult);
      
      // Execute
      await commentService.getCommentThread(commentId, options);
      
      // Verify
      expect(mockCommentRepository.getCommentThread).toHaveBeenCalledWith(commentId, options);
    });
  });

  describe('getComments()', () => {
    it('should get threaded comments for content by default', async () => {
      // Setup
      const contentId = 'content1';
      const content = { id: contentId };
      const commentsResult = {
        comments: [{ id: 'comment1' }],
        totalCount: 10
      };
      
      mockContentRepository.findById.mockResolvedValue(content);
      mockCommentRepository.getThreadedCommentsForContent.mockResolvedValue(commentsResult);
      
      // Execute
      const result = await commentService.getComments(contentId);
      
      // Verify
      expect(mockContentRepository.findById).toHaveBeenCalledWith(contentId);
      expect(mockCommentRepository.getThreadedCommentsForContent).toHaveBeenCalledWith(contentId, 20);
      expect(result.comments).toEqual(commentsResult.comments);
      expect(result.totalCount).toBe(10);
      expect(result.hasMore).toBe(false); // Should be false since comments.length < limit
    });

    it('should get flat comments when threaded option is false', async () => {
      // Setup
      const contentId = 'content1';
      const options = { threaded: false, limit: 10 };
      const content = { id: contentId };
      const commentsResult = {
        comments: [{ id: 'comment1' }, { id: 'comment2' }],
        totalCount: 20
      };
      
      mockContentRepository.findById.mockResolvedValue(content);
      mockCommentRepository.getCommentsForContent.mockResolvedValue(commentsResult);
      
      // Execute
      const result = await commentService.getComments(contentId, options);
      
      // Verify
      expect(mockContentRepository.findById).toHaveBeenCalledWith(contentId);
      expect(mockCommentRepository.getCommentsForContent).toHaveBeenCalledWith(contentId, 10);
      expect(result.comments).toEqual(commentsResult.comments);
      expect(result.totalCount).toBe(20);
      expect(result.hasMore).toBe(true); // Should be true since comments.length >= limit
      expect(result.cursor).toBeDefined(); // Should generate cursor for pagination
    });

    it('should throw an error if content does not exist', async () => {
      // Setup
      mockContentRepository.findById.mockResolvedValue(null);
      
      // Execute & Verify
      await expect(commentService.getComments('nonexistent')).rejects.toThrow();
    });
  });
});
