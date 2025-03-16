/**
 * Content Service Tests
 * 
 * Integration tests for ContentService functionality
 */
import { ContentService } from '../../../services/content/content-service';
import { ContentRepository } from '../../../repositories/content-repository';
import { CommentRepository } from '../../../repositories/comment-repository';
import { CategoryRepository } from '../../../repositories/category-repository';
import { TagRepository } from '../../../repositories/tag-repository';
import { ContentReportRepository } from '../../../repositories/content-report-repository';
import { PointsService } from '../../../services/points/points-service';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../errors/api-errors';

// Mock dependencies
const mockContentRepository = {
  createContent: jest.fn(),
  getContentFeed: jest.fn(),
  getContentWithDetails: jest.fn(),
  findById: jest.fn(),
  updateContent: jest.fn(),
  searchContent: jest.fn(),
  getTrendingContent: jest.fn()
} as unknown as ContentRepository;

const mockCommentRepository = {
  getContentComments: jest.fn(),
  createComment: jest.fn(),
  findById: jest.fn(),
  updateComment: jest.fn()
} as unknown as CommentRepository;

const mockCategoryRepository = {
  getAllCategories: jest.fn(),
  findById: jest.fn(),
  countContentInCategory: jest.fn()
} as unknown as CategoryRepository;

const mockTagRepository = {
  findOrCreateTags: jest.fn(),
  tagContent: jest.fn(),
  getContentTags: jest.fn(),
  getPopularTags: jest.fn()
} as unknown as TagRepository;

const mockContentReportRepository = {
  createReport: jest.fn(),
  hasUserReported: jest.fn()
} as unknown as ContentReportRepository;

const mockPointsService = {
  awardPoints: jest.fn()
} as unknown as PointsService;

// Test data
const testUserId = 'user123';
const testContentId = 'content123';
const testContent = {
  id: testContentId,
  user_id: testUserId,
  type: 'text',
  content_text: 'Test content',
  media_urls: [],
  created_at: new Date(),
  updated_at: new Date(),
  status: 'active'
};

describe('ContentService', () => {
  let contentService: ContentService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service instance with mocks
    contentService = new ContentService(
      mockContentRepository,
      mockCommentRepository,
      mockCategoryRepository,
      mockTagRepository,
      mockContentReportRepository,
      mockPointsService
    );
  });
  
  describe('createContent', () => {
    it('should create content successfully', async () => {
      // Arrange
      const contentData = {
        type: 'text' as const,
        content_text: 'Test content',
        tags: ['tag1', 'tag2']
      };
      
      const mockCreatedContent = { ...testContent };
      const mockTags = [
        { id: 'tag1', name: 'Tag 1' },
        { id: 'tag2', name: 'Tag 2' }
      ];
      
      mockContentRepository.createContent.mockResolvedValue(mockCreatedContent);
      mockTagRepository.findOrCreateTags.mockResolvedValue(mockTags);
      mockTagRepository.tagContent.mockResolvedValue(undefined);
      
      // Act
      const result = await contentService.createContent(testUserId, contentData);
      
      // Assert
      expect(mockContentRepository.createContent).toHaveBeenCalled();
      expect(mockTagRepository.findOrCreateTags).toHaveBeenCalledWith(contentData.tags);
      expect(mockTagRepository.tagContent).toHaveBeenCalledWith(
        mockCreatedContent.id,
        mockTags.map(tag => tag.id)
      );
      expect(mockPointsService.awardPoints).toHaveBeenCalledWith(
        testUserId,
        expect.any(Number),
        'content_creation',
        expect.any(Object)
      );
      expect(result.content).toEqual(mockCreatedContent);
      expect(result.tags).toEqual(mockTags);
    });
    
    it('should validate category ID if provided', async () => {
      // Arrange
      const contentData = {
        type: 'text' as const,
        content_text: 'Test content',
        categoryId: 'category123'
      };
      
      mockCategoryRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(contentService.createContent(testUserId, contentData))
        .rejects.toThrow(ValidationError);
        
      expect(mockContentRepository.createContent).not.toHaveBeenCalled();
    });
  });
  
  describe('getContentById', () => {
    it('should get content with details', async () => {
      // Arrange
      const mockContentWithDetails = {
        ...testContent,
        comments: [],
        reactions: {}
      };
      const mockTags = [{ id: 'tag1', name: 'Tag 1' }];
      
      mockContentRepository.getContentWithDetails.mockResolvedValue(mockContentWithDetails);
      mockTagRepository.getContentTags.mockResolvedValue(mockTags);
      
      // Act
      const result = await contentService.getContentById(testContentId);
      
      // Assert
      expect(mockContentRepository.getContentWithDetails).toHaveBeenCalledWith(testContentId);
      expect(mockTagRepository.getContentTags).toHaveBeenCalledWith(testContentId);
      expect(result).toEqual({
        ...mockContentWithDetails,
        tags: mockTags
      });
    });
    
    it('should throw NotFoundError if content is not found', async () => {
      // Arrange
      mockContentRepository.getContentWithDetails.mockResolvedValue(null);
      
      // Act & Assert
      await expect(contentService.getContentById(testContentId))
        .rejects.toThrow(NotFoundError);
    });
  });
  
  describe('updateContent', () => {
    it('should update content if user is the owner', async () => {
      // Arrange
      const updateData = {
        content_text: 'Updated content',
        tags: ['tag1', 'tag2']
      };
      
      const mockTags = [
        { id: 'tag1', name: 'Tag 1' },
        { id: 'tag2', name: 'Tag 2' }
      ];
      
      mockContentRepository.findById.mockResolvedValue(testContent);
      mockContentRepository.updateContent.mockResolvedValue({
        ...testContent,
        content_text: updateData.content_text
      });
      mockTagRepository.findOrCreateTags.mockResolvedValue(mockTags);
      
      // Act
      const result = await contentService.updateContent(testContentId, testUserId, updateData);
      
      // Assert
      expect(mockContentRepository.findById).toHaveBeenCalledWith(testContentId);
      expect(mockContentRepository.updateContent).toHaveBeenCalledWith(
        testContentId,
        expect.objectContaining({ content_text: updateData.content_text })
      );
      expect(mockTagRepository.findOrCreateTags).toHaveBeenCalledWith(updateData.tags);
      expect(mockTagRepository.tagContent).toHaveBeenCalled();
      expect(result.content_text).toBe(updateData.content_text);
    });
    
    it('should throw ForbiddenError if user is not the owner', async () => {
      // Arrange
      const differentUserId = 'anotherUser';
      const updateData = { content_text: 'Updated content' };
      
      mockContentRepository.findById.mockResolvedValue(testContent);
      
      // Act & Assert
      await expect(contentService.updateContent(testContentId, differentUserId, updateData))
        .rejects.toThrow(ForbiddenError);
        
      expect(mockContentRepository.updateContent).not.toHaveBeenCalled();
    });
    
    it('should throw NotFoundError if content not found', async () => {
      // Arrange
      const updateData = { content_text: 'Updated content' };
      
      mockContentRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(contentService.updateContent(testContentId, testUserId, updateData))
        .rejects.toThrow(NotFoundError);
        
      expect(mockContentRepository.updateContent).not.toHaveBeenCalled();
    });
  });
  
  // Additional tests would cover the remaining functionality in ContentService
  // including comments, reports, categories, and tags
});
