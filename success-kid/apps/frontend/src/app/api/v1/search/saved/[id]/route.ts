import { NextRequest, NextResponse } from 'next/server';
import { SavedSearch } from '@/types';

// Import and re-export the mock storage from the parent route
// In a real implementation, we would use a database instead
import { SAVED_SEARCHES } from '../route';

/**
 * Delete a saved search by ID
 * This is a mock implementation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find the search to delete (in a real implementation, this would be a database query)
    const searchIndex = SAVED_SEARCHES.findIndex(search => search.id === id);
    
    if (searchIndex === -1) {
      return NextResponse.json(
        {
          error: 'Saved search not found',
        },
        { status: 404 }
      );
    }
    
    // Remove the search from storage (in a real implementation, this would be a database delete)
    SAVED_SEARCHES.splice(searchIndex, 1);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete saved search',
      },
      { status: 500 }
    );
  }
}
