import { Metadata } from 'next'
import { ContentCreation, DraftsList } from '@/components/features/creation'

export const metadata: Metadata = {
  title: 'Create Content | Wild 'n Out',
  description: 'Create and share your content with the Wild 'n Out community',
}

// This would come from an API call in a real app
const MOCK_BATTLES = [
  {
    id: 'battle-123',
    title: 'Wild Style Battle',
    description: 'Show your freestyle skills with celebrity impressions.',
    battleType: 'wildStyle',
    creatorId: 'user-1',
    status: 'active',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
    votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), // 5 hours from now
    votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 29).toISOString(), // 29 hours from now
    participantCount: 15,
    entryCount: 15,
    voteCount: 0,
    featured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'battle-456',
    title: 'R&Beef Challenge',
    description: 'Create a short rap about your favorite Wild 'n Out moment.',
    battleType: 'rAndBeef',
    creatorId: 'user-1',
    status: 'active',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // 10 hours from now
    votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // 10 hours from now
    votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 34).toISOString(), // 34 hours from now
    participantCount: 25,
    entryCount: 25,
    voteCount: 0,
    featured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
  {
    id: 'battle-789',
    title: 'Pick Up & Kill It',
    description: 'Make up a funny joke using these three words: stage, mic, laugh.',
    battleType: 'pickUpKillIt',
    creatorId: 'user-1',
    status: 'active',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // 14 hours from now
    votingStartTime: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // 14 hours from now
    votingEndTime: new Date(Date.now() + 1000 * 60 * 60 * 38).toISOString(), // 38 hours from now
    participantCount: 35,
    entryCount: 35,
    voteCount: 0,
    featured: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  }
]

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Creator Studio</h1>
      
      <div className="mb-8">
        <ContentCreation availableBattles={MOCK_BATTLES} />
      </div>
      
      <DraftsList onEditDraft={(draftId) => console.log('Edit draft', draftId)} />
    </div>
  )
}
