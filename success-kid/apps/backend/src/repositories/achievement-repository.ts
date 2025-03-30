import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { 
    achievements, 
    userAchievements, 
    Achievement, 
    UserAchievement, 
    NewAchievement, 
    NewUserAchievement 
} from '../database/schema/achievements';
import { db } from '../database';
import { logger } from '../lib/logger';

// Define specific entity types for the repository
type AchievementEntity = Achievement; // Maps to 'achievements' table select type
type UserAchievementEntity = UserAchievement; // Maps to 'user_achievements' table select type

export class AchievementRepository extends BaseRepository<AchievementEntity, typeof achievements, NewAchievement> {
    constructor() {
        super(
            achievements, 
            achievements.id,
            { // Optional mapping for sorting/filtering based on AchievementEntity keys
                name: achievements.name,
                category: achievements.category,
                createdAt: achievements.createdAt,
                isEnabled: achievements.isEnabled
            }
        );
    }

    // --- Achievement Definitions ---

    async findEnabledAchievements(): Promise<AchievementEntity[]> {
        try {
            const results = await db.select().from(this.table).where(eq(this.table.isEnabled, true));
            return results.map(record => this.mapToEntity(record)); 
        } catch (error) {
            this.logError('findEnabledAchievements', error);
            throw this.wrapError('Failed to find enabled achievements', error);
        }
    }

    // --- User Achievements (Interacting with the 'userAchievements' table directly) ---

    async findUserAchievement(userId: string, achievementId: string): Promise<UserAchievementEntity | null> {
        try {
            const result = await db
                .select()
                .from(userAchievements) 
                .where(and(
                    eq(userAchievements.userId, userId),
                    eq(userAchievements.achievementId, achievementId)
                ))
                .limit(1);
            return result.length > 0 ? this.mapUserAchievementToEntity(result[0]) : null; 
        } catch (error) {
            this.logError('findUserAchievement', error, { userId, achievementId });
            throw this.wrapError('Failed to find user achievement', error);
        }
    }

    async findUserAchievements(userId: string, options?: { unlocked?: boolean, limit?: number }): Promise<UserAchievementEntity[]> {
        try {
            const conditions = [eq(userAchievements.userId, userId)];
            if (options?.unlocked !== undefined) {
                conditions.push(eq(userAchievements.isUnlocked, options.unlocked));
            }

            // Start query and cast to 'any' to allow flexible chaining
            let query: any = db
                .select()
                .from(userAchievements)
                .where(and(...conditions));

            // Apply orderBy
            query = query.orderBy(desc(userAchievements.updatedAt)); 

            // Apply limit
            if (options?.limit) {
                query = query.limit(options.limit); 
            }

            const results = await query;
            return results.map((record: Record<string, any>) => this.mapUserAchievementToEntity(record)); 
        } catch (error) {
            this.logError('findUserAchievements', error, { userId, options });
            throw this.wrapError('Failed to find user achievements', error);
        }
    }
    
    async findRecentUserUnlocks(userId: string, limit: number = 5): Promise<UserAchievementEntity[]> {
        try {
            const results = await db
                .select()
                .from(userAchievements)
                .where(and(
                    eq(userAchievements.userId, userId),
                    eq(userAchievements.isUnlocked, true)
                ))
                .orderBy(desc(userAchievements.unlockedAt)) 
                .limit(limit);
            return results.map(record => this.mapUserAchievementToEntity(record)); 
        } catch (error) {
            this.logError('findRecentUserUnlocks', error, { userId, limit });
            throw this.wrapError('Failed to find recent user unlocks', error);
        }
    }

    async upsertUserAchievementProgress(
        userId: string, 
        achievementId: string, 
        progressIncrement: number,
        isComplete: boolean,
        unlockedTimestamp?: Date | null
    ): Promise<UserAchievementEntity> {
        try {
            const dataToInsert: NewUserAchievement = {
                userId,
                achievementId,
                progress: progressIncrement,
                isUnlocked: isComplete,
                unlockedAt: isComplete ? (unlockedTimestamp ?? new Date()) : null,
                updatedAt: new Date()
            };

            const result = await db.insert(userAchievements)
                .values(dataToInsert)
                .onConflictDoUpdate({
                    target: [userAchievements.userId, userAchievements.achievementId],
                    set: {
                        progress: sql`${userAchievements.progress} + ${isComplete ? 0 : progressIncrement}`, 
                        isUnlocked: sql`CASE WHEN ${userAchievements.isUnlocked} = TRUE THEN TRUE ELSE ${isComplete} END`,
                        unlockedAt: sql`CASE WHEN ${userAchievements.isUnlocked} = TRUE THEN ${userAchievements.unlockedAt} ELSE ${isComplete ? (unlockedTimestamp ?? new Date()) : null} END`,
                        updatedAt: new Date()
                    },
                    where: eq(userAchievements.isUnlocked, false) 
                })
                .returning(); 

            let finalRecord: UserAchievementEntity;
            if (result.length === 0) {
                 const existing = await this.findUserAchievement(userId, achievementId);
                 if (!existing) {
                    logger.error('Failed to upsert or find user achievement after conflict', { userId, achievementId });
                    throw new Error('Failed to upsert or find user achievement');
                 }
                 finalRecord = existing; 
            } else {
                 finalRecord = this.mapUserAchievementToEntity(result[0]); 
            }
            
            return finalRecord;

        } catch (error) {
            this.logError('upsertUserAchievementProgress', error, { userId, achievementId, progressIncrement, isComplete });
            throw this.wrapError('Failed to upsert user achievement progress', error);
        }
    }
    
    async markUserAchievementUnlocked(
        userId: string, 
        achievementId: string,
        timestamp?: Date | null
    ): Promise<UserAchievementEntity | null> {
         try {
             const result = await db.update(userAchievements)
                 .set({ 
                     isUnlocked: true, 
                     unlockedAt: timestamp ?? new Date(),
                     updatedAt: new Date() 
                 })
                 .where(and(
                     eq(userAchievements.userId, userId),
                     eq(userAchievements.achievementId, achievementId),
                     eq(userAchievements.isUnlocked, false) 
                 ))
                 .returning();
             return result.length > 0 ? this.mapUserAchievementToEntity(result[0]) : null; 
         } catch (error) {
             this.logError('markUserAchievementUnlocked', error, { userId, achievementId });
             throw this.wrapError('Failed to mark user achievement as unlocked', error);
         }
    }
    
    // Helper mapper for userAchievements table records
    protected mapUserAchievementToEntity(record: Record<string, any>): UserAchievementEntity {
         return {
             userId: record.user_id, 
             achievementId: record.achievement_id, 
             progress: record.progress,
             isUnlocked: record.is_unlocked, 
             unlockedAt: record.unlocked_at, 
             notified: record.notified,
             createdAt: record.created_at, 
             updatedAt: record.updated_at 
         };
    }

    // Implementation of the abstract mapToEntity method from BaseRepository
    // This maps the 'achievements' table record (this.table) to the Achievement entity
    protected mapToEntity(record: Record<string, any>): AchievementEntity {
        return {
            id: record.id,
            name: record.name,
            description: record.description,
            category: record.category,
            criteriaType: record.criteria_type, 
            criteriaThreshold: record.criteria_threshold, 
            pointsAwarded: record.points_awarded, 
            iconUrl: record.icon_url, 
            isEnabled: record.is_enabled, 
            createdAt: record.created_at, 
            updatedAt: record.updated_at, 
        };
    }
}

// Export a singleton instance
export const achievementRepository = new AchievementRepository();
