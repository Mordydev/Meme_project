/**
 * Event Simulator API Client
 * For server-side use only (not exposed to client)
 */

/**
 * Simulate a points awarded event
 * @param userId User ID to award points to
 * @param amount Optional amount of points to award
 * @param source Optional source of the points
 * @returns Promise with the result
 */
export async function simulatePointsAwarded(userId: string, amount?: number, source?: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/simulate/points.awarded`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        source,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error simulating points awarded', error);
    return { success: false, message: 'Error simulating event' };
  }
}

/**
 * Simulate an achievement unlocked event
 * @param userId User ID to unlock achievement for
 * @param achievementData Optional achievement data
 * @returns Promise with the result
 */
export async function simulateAchievementUnlocked(userId: string, achievementData?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/simulate/achievement.unlocked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        achievement: achievementData,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error simulating achievement unlocked', error);
    return { success: false, message: 'Error simulating event' };
  }
}

/**
 * Simulate a content created event
 * @param contentData Optional content data
 * @returns Promise with the result
 */
export async function simulateContentCreated(contentData?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/simulate/content.created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error simulating content created', error);
    return { success: false, message: 'Error simulating event' };
  }
}

/**
 * Simulate a milestone reached event
 * @param milestoneData Optional milestone data
 * @returns Promise with the result
 */
export async function simulateMilestoneReached(milestoneData?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/simulate/milestone.reached`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(milestoneData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error simulating milestone reached', error);
    return { success: false, message: 'Error simulating event' };
  }
}

/**
 * Publish a custom event
 * @param type Event type
 * @param data Event data
 * @returns Promise with the result
 */
export async function publishCustomEvent(type: string, data: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error publishing custom event', error);
    return { success: false, message: 'Error publishing event' };
  }
}