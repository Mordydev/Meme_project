import { BaseRepository } from '../../src/repositories/core/base-repository';
import { NotFoundError } from '../../src/lib/errors';

// Create a test implementation of BaseRepository
class TestRepository extends BaseRepository<{ id: string; name: string; active: boolean; createdAt?: Date; updatedAt?: Date }> {
  constructor(fastify: any) {
    super(fastify, 'test_table');
  }
}

// Mock Supabase client responses
const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ 
  select: mockSelect,
  insert: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn()
    }))
  })),
  update: jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  })),
  delete: jest.fn(() => ({
    eq: jest.fn()
  })),
}));

// Mock Fastify instance
const mockFastify = {
  supabase: {
    from: mockFrom
  },
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
};

describe('BaseRepository', () => {
  let repository: TestRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockSelect.mockImplementation(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'test-1', name: 'Test Entity', active: true },
          error: null
        }))
      }))
    }));
    
    repository = new TestRepository(mockFastify);
  });
  
  describe('findById', () => {
    it('should return entity when found', async () => {
      const result = await repository.findById('test-1');
      
      expect(mockFrom).toHaveBeenCalledWith('test_table');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual({ id: 'test-1', name: 'Test Entity', active: true });
    });
    
    it('should return null when entity not found', async () => {
      // Mock not found response
      mockSelect.mockImplementation(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { code: 'PGRST116' }
          }))
        }))
      }));
      
      const result = await repository.findById('not-found');
      
      expect(result).toBeNull();
    });
    
    it('should throw error on database failure', async () => {
      // Mock database error
      mockSelect.mockImplementation(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { code: 'OTHER_ERROR', message: 'Database error' }
          }))
        }))
      }));
      
      await expect(repository.findById('test-1')).rejects.toThrow('Failed to get test_table with ID test-1');
    });
  });
  
  // More tests would be added for other methods like findMany, create, update, etc.
});
