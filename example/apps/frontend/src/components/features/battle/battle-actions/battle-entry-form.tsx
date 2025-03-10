'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { submitBattleEntry } from '@/lib/actions/battle-actions'
import { useBattleStore } from '@/lib/state/battle-store'
import { useFormState } from 'react-dom'
import { Mic, Image as ImageIcon, Upload, Play, Pause, Check } from 'lucide-react'
import confetti from 'canvas-confetti'

interface BattleEntryFormProps {
  battleId: string
  onCancel: () => void
  onSuccess: () => void
}

const initialState = {
  success: false,
  errors: {}
}

export function BattleEntryForm({ 
  battleId, 
  onCancel, 
  onSuccess 
}: BattleEntryFormProps) {
  const { addSubmission } = useBattleStore()
  const [activeTab, setActiveTab] = useState('text')
  const [contentType, setContentType] = useState<'text' | 'image' | 'audio' | 'video' | 'mixed'>('text')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [state, formAction] = useFormState(submitBattleEntry, initialState)
  
  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    // Call the server action
    const result = await submitBattleEntry({}, formData)
    
    if (result.success) {
      // Track submission in local store
      addSubmission(battleId)
      
      // Trigger success confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Notify parent component
      onSuccess()
    }
    
    setIsSubmitting(false)
  }
  
  // Handle recording toggling (simulated)
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      // In a real app, we would stop recording and process the audio
    } else {
      setIsRecording(true)
      // In a real app, we would start recording audio
    }
  }
  
  // If submission was successful
  if (state.success) {
    return (
      <Card className="bg-victory-green/10 border border-victory-green">
        <CardContent className="pt-6">
          <div className="flex items-center mb-3">
            <div className="bg-victory-green/20 rounded-full p-2 mr-3">
              <Check className="h-6 w-6 text-victory-green" />
            </div>
            <h3 className="text-xl font-display text-hype-white">Submission Successful!</h3>
          </div>
          <p className="text-hype-white/70 mb-4">
            Your entry has been submitted successfully. Check back later to see how it performs!
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onSuccess}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="bg-zinc-800/40 border border-zinc-700">
      <CardContent className="pt-6">
        <h3 className="text-xl font-display text-hype-white mb-4">Submit Your Battle Entry</h3>
        
        {/* Content type selection */}
        <div className="mb-6">
          <Label className="mb-2 block">Content Type</Label>
          <RadioGroup 
            defaultValue="text" 
            className="flex flex-wrap gap-3" 
            onValueChange={(value) => setContentType(value as any)}
          >
            <div>
              <RadioGroupItem value="text" id="text" className="peer sr-only" />
              <Label
                htmlFor="text"
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 hover:bg-zinc-700 peer-data-[state=checked]:border-battle-yellow peer-data-[state=checked]:bg-battle-yellow/10 peer-data-[state=checked]:text-battle-yellow"
              >
                <span>Text</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem value="image" id="image" className="peer sr-only" />
              <Label
                htmlFor="image"
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 hover:bg-zinc-700 peer-data-[state=checked]:border-battle-yellow peer-data-[state=checked]:bg-battle-yellow/10 peer-data-[state=checked]:text-battle-yellow"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Image</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem value="audio" id="audio" className="peer sr-only" />
              <Label
                htmlFor="audio"
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 hover:bg-zinc-700 peer-data-[state=checked]:border-battle-yellow peer-data-[state=checked]:bg-battle-yellow/10 peer-data-[state=checked]:text-battle-yellow"
              >
                <Mic className="h-4 w-4" />
                <span>Audio</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem value="mixed" id="mixed" className="peer sr-only" />
              <Label
                htmlFor="mixed"
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 hover:bg-zinc-700 peer-data-[state=checked]:border-battle-yellow peer-data-[state=checked]:bg-battle-yellow/10 peer-data-[state=checked]:text-battle-yellow"
              >
                <span>Mixed</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Entry content based on selected type */}
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="battleId" value={battleId} />
          <input type="hidden" name="contentType" value={contentType} />
          
          {/* Text entry */}
          {contentType === 'text' && (
            <div>
              <Label htmlFor="body" className="mb-2 block">
                Your Entry <span className="text-roast-red">*</span>
              </Label>
              <Textarea
                id="body"
                name="body"
                placeholder="Drop your bars here..."
                rows={5}
                className="resize-none"
                required
              />
              {state.errors?.body && (
                <p className="text-roast-red text-sm mt-1">{state.errors.body}</p>
              )}
            </div>
          )}
          
          {/* Image upload */}
          {contentType === 'image' && (
            <div>
              <Label htmlFor="mediaUrl" className="mb-2 block">
                Upload Image <span className="text-roast-red">*</span>
              </Label>
              <div className="border-2 border-dashed border-zinc-700 rounded-md p-6 text-center">
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  type="text"
                  className="hidden"
                  placeholder="Image URL"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="h-10 w-10 text-zinc-500" />
                  <p className="text-sm text-zinc-400">Drag and drop an image, or click to browse</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
              {state.errors?.mediaUrl && (
                <p className="text-roast-red text-sm mt-1">{state.errors.mediaUrl}</p>
              )}
            </div>
          )}
          
          {/* Audio recording */}
          {contentType === 'audio' && (
            <div>
              <Label className="mb-2 block">
                Record Audio <span className="text-roast-red">*</span>
              </Label>
              <div className="border border-zinc-700 rounded-md p-4">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant={isRecording ? 'destructive' : 'outline'}
                    size="lg"
                    className="rounded-full w-16 h-16 flex items-center justify-center"
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>
                  
                  <p className="text-zinc-400">
                    {isRecording 
                      ? `Recording... ${recordingTime}s` 
                      : 'Click to start recording'}
                  </p>
                  
                  {isRecording && (
                    <div className="w-full bg-zinc-700 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-battle-yellow h-full rounded-full"
                        style={{ width: `${Math.min((recordingTime / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <input
                  id="mediaUrl"
                  name="mediaUrl"
                  type="hidden"
                  value="https://example.com/sample-audio.mp3"
                />
              </div>
            </div>
          )}
          
          {/* Mixed content */}
          {contentType === 'mixed' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="body" className="mb-2 block">
                  Text Content
                </Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Your text content..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="mediaUrl" className="mb-2 block">
                  Primary Media
                </Label>
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  type="text"
                  placeholder="Media URL"
                />
              </div>
            </div>
          )}
          
          {/* Form error */}
          {state.errors?.form && (
            <div className="bg-roast-red/20 border border-roast-red rounded-md p-3">
              <p className="text-roast-red">{state.errors.form}</p>
            </div>
          )}
          
          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
