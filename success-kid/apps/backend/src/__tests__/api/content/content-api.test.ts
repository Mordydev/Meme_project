/**
 * Content API Tests
 * 
 * Integration tests for content API endpoints
 */
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../../app';
import { ContentService } from '../../../services/content/content-service';

// Mock auth for testing
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((request, reply, done) => {
    request.user = { id: 'test-user-id' };
    done();
  })
}));

// Mock content service methods
const mockGetContentFeed = jest.fn();
const mockGetContentById = jest.fn();
const mockCreateContent = jest.fn();
const mockUpdateContent = jest.fn();
const mockDeleteContent = jest.fn();
const mockSearchContent = jest.fn();
const mockGetTrendingContent = jest.fn();
const mockGetCategories = jest.fn();
const mockGetPopularTags = jest.fn();

// Mock the content service
jest.mock('../../../services/content/content-service', () => {
  return {
    ContentService: jest.fn().mockImplementation(() => ({
      getContentFeed: mockGetContentFeed,
      getContentById: mockGetContentById,
      createContent: mockCreateContent,
      updateContent: mockUpdateContent,
      deleteContent: mockDeleteContent,
      searchContent: mockSearchContent,
      getTrendingContent: mockGetTrendingContent,
      getCategories: mockGetCategories,
      getPopularTags: mockGetPopularTags
    }))
  };
});

describe('Content API', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/v1/content', () => {
    it('should return content feed', async () => {
      // Arrange
      const mockContent = [
        { id: 'content1', content_text: 'Test content 1' },
        { id: 'content2', content_text: 'Test content 2' }
      ];
      mockGetContentFeed.mockResolvedValue(mockContent);
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/content',
        query: {
          type: 'text',
          sortBy: 'recent',
          limit: '10'
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockContent);
      expect(mockGetContentFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          sortBy: 'recent',
          limit: 10
        })
      );
    });
  });
  
  describe('GET /api/v1/content/:id', () => {
    it('should return content by ID', async () => {
      // Arrange
      const contentId = 'content123';
      const mockContent = {
        id: contentId,
        content_text: 'Test content',
        user_id: 'user123',
        tags: [{ id: 'tag1', name: 'Tag 1' }]
      };
      mockGetContentById.mockResolvedValue(mockContent);
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/content/${contentId}`
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockContent);
      expect(mockGetContentById).toHaveBeenCalledWith(contentId);
    });
    
    it('should return 404 if content not found', async () => {
      // Arrange
      const contentId = 'nonexistent';
      mockGetContentById.mockRejectedValue({
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404,
        message: 'Content not found'
      });
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/content/${contentId}`
      });
      
      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  
  describe('POST /api/v1/content', () => {
    it('should create new content', async () => {
      // Arrange
      const createData = {
        type: 'text',
        content_text: 'New content',
        tags: ['tag1', 'tag2']
      };
      const mockCreatedContent = {
        content: {
          id: 'new-content-id',
          ...createData,
          user_id: 'test-user-id',
          created_at: new Date().toISOString(),
          status: 'active'
        },
        tags: [
          { id: 'tag1', name: 'Tag 1' },
          { id: 'tag2', name: 'Tag 2' }
        ]
      };
      mockCreateContent.mockResolvedValue(mockCreatedContent);
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/content',
        payload: createData
      });
      
      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockCreatedContent);
      expect(mockCreateContent).toHaveBeenCalledWith('test-user-id', createData);
    });
    
    it('should return 400 for invalid input', async () => {
      // Arrange
      const invalidData = {
        // Missing required 'type' field
        content_text: 'New content'
      };
      
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/content',
        payload: invalidData
      });
      
      // Assert
      expect(response.statusCode).toBe(400);
      expect(mockCreateContent).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/v1/content/trending', () => {
    it('should return trending content', async () => {
      // Arrange
      const mockTrendingContent = [
        { id: 'content1', content_text: 'Trending content 1', trending_score: 50 },
        { id: 'content2', content_text: 'Trending content 2', trending_score: 45 }
      ];
      mockGetTrendingContent.mockResolvedValue(mockTrendingContent);
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/content/trending',
        query: {
          limit: '10',
          timeframe: 'week'
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockTrendingContent);
      expect(mockGetTrendingContent).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          timeframe: 'week'
        })
      );
    });
  });
  
  describe('GET /api/v1/content/categories', () => {
    it('should return categories', async () => {
      // Arrange
      const mockCategories = [
        { id: 'cat1', name: 'Category 1', content_count: 10 },
        { id: 'cat2', name: 'Category 2', content_count: 5 }
      ];
      mockGetCategories.mockResolvedValue(mockCategories);
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/content/categories'
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockCategories);
      expect(mockGetCategories).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/v1/content/tags/popular', () => {
    it('should return popular tags', async () => {
      // Arrange
      const mockTags = [
        { id: 'tag1', name: 'Tag 1', count: 50 },
        { id: 'tag2', name: 'Tag 2', count: 30 }
      ];
      mockGetPopularTags.mockResolvedValue(mockTags);
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/content/tags/popular',
        query: {
          limit: '20'
        }
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(mockTags);
      expect(mockGetPopularTags).toHaveBeenCalledWith(20);
    });
  });
  
  // Additional test cases would cover the remaining API endpoints
  // including comments, reports, search, etc.
});
