'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ContentData, ContentType } from '@/types/content'

// Schema for content validation
const contentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  type: z.enum(["text", "image", "audio", "video", "mixed"], {
    errorMap: () => ({ message: "Please select a valid content type" })
  }),
  body: z.string().optional(),
  mediaUrl: z.string().url("Please provide a valid media URL").optional(),
  additionalMedia: z.array(z.string().url("Please provide valid media URLs")).optional(),
  tags: z.array(z.string()).optional(),
  contextType: z.enum(["battle", "community"], {
    errorMap: () => ({ message: "Please select a valid context type" })
  }),
  battleId: z.string().optional(),
  status: z.enum(["draft", "published"]).default("published")
}).refine(
  (content) => {
    // Ensure at least one of body or mediaUrl is provided
    return Boolean(content.body) || Boolean(content.mediaUrl);
  },
  {
    message: "Please provide either text content or media",
    path: ["content"]
  }
).refine(
  (content) => {
    // If context is battle, battleId is required
    return content.contextType !== 'battle' || Boolean(content.battleId);
  },
  {
    message: "Battle ID is required for battle content",
    path: ["battleId"]
  }
);

/**
 * Server action to create new content
 */
export async function createContent(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const contentData: ContentData = {
      title: formData.get('title') as string,
      type: formData.get('type') as ContentType,
      body: formData.get('body') as string || undefined,
      mediaUrl: formData.get('mediaUrl') as string || undefined,
      additionalMedia: formData.getAll('additionalMedia') as string[],
      tags: formData.getAll('tags') as string[],
      contextType: formData.get('contextType') as 'battle' | 'community',
      battleId: formData.get('battleId') as string || undefined,
      status: formData.get('status') as 'draft' | 'published' || 'published'
    }
    
    // Validate data
    const validatedData = contentSchema.safeParse(contentData)
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData.data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to create content'
        }
      }
    }
    
    const content = await response.json()
    
    // Revalidate paths
    if (contentData.contextType === 'battle' && contentData.battleId) {
      revalidatePath(`/battle/${contentData.battleId}`)
    } else {
      revalidatePath('/community')
    }
    
    if (contentData.status === 'published') {
      // Redirect based on context
      if (contentData.contextType === 'battle' && contentData.battleId) {
        redirect(`/battle/${contentData.battleId}`)
      } else {
        redirect(`/community`)
      }
    } else {
      // For drafts, return success
      return {
        success: true,
        contentId: content.id,
        isDraft: true
      }
    }
  } catch (error) {
    console.error('Content creation error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}

/**
 * Server action to update existing content
 */
export async function updateContent(prevState: any, formData: FormData) {
  try {
    const contentId = formData.get('contentId') as string
    
    if (!contentId) {
      return {
        success: false,
        errors: { 
          form: 'Content ID is required'
        }
      }
    }
    
    // Extract form data
    const contentData: ContentData = {
      title: formData.get('title') as string,
      type: formData.get('type') as ContentType,
      body: formData.get('body') as string || undefined,
      mediaUrl: formData.get('mediaUrl') as string || undefined,
      additionalMedia: formData.getAll('additionalMedia') as string[],
      tags: formData.getAll('tags') as string[],
      contextType: formData.get('contextType') as 'battle' | 'community',
      battleId: formData.get('battleId') as string || undefined,
      status: formData.get('status') as 'draft' | 'published' || 'published'
    }
    
    // Validate data
    const validatedData = contentSchema.safeParse(contentData)
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${contentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData.data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to update content'
        }
      }
    }
    
    const content = await response.json()
    
    // Revalidate paths
    revalidatePath(`/create`) // Update drafts list
    
    if (contentData.contextType === 'battle' && contentData.battleId) {
      revalidatePath(`/battle/${contentData.battleId}`)
    } else {
      revalidatePath('/community')
    }
    
    if (contentData.status === 'published') {
      // Redirect based on context
      if (contentData.contextType === 'battle' && contentData.battleId) {
        redirect(`/battle/${contentData.battleId}`)
      } else {
        redirect(`/community`)
      }
    } else {
      // For drafts, return success
      return {
        success: true,
        contentId: content.id,
        isDraft: true
      }
    }
  } catch (error) {
    console.error('Content update error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}

/**
 * Server action to delete content
 */
export async function deleteContent(prevState: any, formData: FormData) {
  try {
    const contentId = formData.get('contentId') as string
    
    if (!contentId) {
      return {
        success: false,
        errors: { 
          form: 'Content ID is required'
        }
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/${contentId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to delete content'
        }
      }
    }
    
    // Revalidate paths
    revalidatePath('/create') // Update drafts list
    revalidatePath('/community') 
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Content deletion error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}
