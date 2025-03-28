/**
 * Taxonomy Service Module
 * 
 * Exports taxonomy service for categories and tags
 */
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { TaxonomyService } from './taxonomy-service';

// Taxonomy service factory
export function createTaxonomyService(
  categoryRepository: CategoryRepository,
  tagRepository: TagRepository
): TaxonomyService {
  return new TaxonomyService(
    categoryRepository,
    tagRepository
  );
}

export { TaxonomyService } from './taxonomy-service';
