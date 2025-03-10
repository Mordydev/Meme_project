'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CreateBattleParams, SubmitBattleEntryParams } from '@/types/battle'

// Schema for battle creation
const createBattleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  battleType: z.enum(["wildStyle", "pickUpKillIt", "rAndBeef", "tournament"], {
    errorMap: () => ({ message: "Please select a valid battle type" })
  }),
  startTime: z.string().optional(),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End time must be a valid date"
  }),
  rules: z.object({
    maxParticipants: z.number().int().positive().optional(),
    submissionTimeLimit: z.number().int().positive().optional(),
    mediaTypes: z.array(z.string()).optional()
  }).optional()
})

// Schema for battle entry submission
const submitEntrySchema = z.object({
  battleId: z.string().min(1, "Battle ID is required"),
  content: z.object({
    type: z.enum(["text", "image", "audio", "video", "mixed"], {
      errorMap: () => ({ message: "Please select a valid content type" })
    }),
    body: z.string().optional(),
    mediaUrl: z.string().url("Please provide a valid media URL").optional(),
    additionalMedia: z.array(z.string().url("Please provide valid media URLs")).optional()
  }).refine(
    (content) => {
      // Ensure at least one of body or mediaUrl is provided
      return Boolean(content.body) || Boolean(content.mediaUrl);
    },
    {
      message: "Please provide either text content or media"
    }
  )
})

/**
 * Server action to create a new battle
 */
export async function createBattle(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const battleData: CreateBattleParams = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      battleType: formData.get('battleType') as CreateBattleParams['battleType'],
      startTime: formData.get('startTime') as string || undefined,
      endTime: formData.get('endTime') as string,
      rules: {
        maxParticipants: formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : undefined,
        submissionTimeLimit: formData.get('submissionTimeLimit') ? Number(formData.get('submissionTimeLimit')) : undefined,
        mediaTypes: formData.getAll('mediaTypes') as string[]
      }
    }
    
    // Validate data
    const validatedData = createBattleSchema.safeParse(battleData)
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles`, {
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
          form: error.message || 'Failed to create battle'
        }
      }
    }
    
    const battle = await response.json()
    
    // Revalidate the battles list page
    revalidatePath('/battle')
    
    // Redirect to the new battle
    redirect(`/battle/${battle.id}`)
  } catch (error) {
    console.error('Battle creation error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}

/**
 * Server action to submit an entry to a battle
 */
export async function submitBattleEntry(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const entryData: SubmitBattleEntryParams = {
      battleId: formData.get('battleId') as string,
      content: {
        type: formData.get('contentType') as SubmitBattleEntryParams['content']['type'],
        body: formData.get('body') as string || undefined,
        mediaUrl: formData.get('mediaUrl') as string || undefined,
        additionalMedia: formData.getAll('additionalMedia') as string[]
      }
    }
    
    // Validate data
    const validatedData = submitEntrySchema.safeParse(entryData)
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles/${entryData.battleId}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData.data.content)
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to submit entry'
        }
      }
    }
    
    const entry = await response.json()
    
    // Revalidate the battle page to show the new entry
    revalidatePath(`/battle/${entryData.battleId}`)
    
    return {
      success: true,
      entryId: entry.id
    }
  } catch (error) {
    console.error('Battle entry submission error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}

/**
 * Server action to vote on a battle entry
 */
export async function voteBattleEntry(prevState: any, formData: FormData) {
  try {
    const battleId = formData.get('battleId') as string
    const entryId = formData.get('entryId') as string
    
    if (!battleId || !entryId) {
      return {
        success: false,
        errors: { 
          form: 'Battle ID and entry ID are required'
        }
      }
    }
    
    // Submit vote to API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entryId })
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to submit vote'
        }
      }
    }
    
    // Revalidate the battle page to update vote counts
    revalidatePath(`/battle/${battleId}`)
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Vote submission error:', error)
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}
