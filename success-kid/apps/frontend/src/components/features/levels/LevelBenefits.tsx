'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLevelContext } from './LevelProvider';

interface LevelBenefitsProps {
  className?: string;
}

/**
 * LevelBenefits
 * 
 * Component to display the benefits of the current level and preview next level benefits.
 */
export function LevelBenefits({ className }: LevelBenefitsProps) {
  const { level, title, benefits, badges } = useLevelContext();
  
  // Define next level benefits based on current level
  // This would ideally come from the API, but for now we'll use static data
  const nextLevelBenefits = {
    1: ["Custom avatar frame", "Basic profile customization"],
    2: ["Post formatting options", "Expanded profile options"],
    3: ["Custom name color", "Priority in new features"],
    4: ["Post highlighting", "Extended character limits"],
    5: ["Special emotes", "Custom profile badges"],
    6: ["Profile banner options", "Content showcase features"],
    7: ["Comment spotlight", "Featured profile moments"],
    8: ["Special platform effects", "Exclusive community access"],
    9: ["Platform ambassador status", "Beta feature access"],
    10: []
  };
  
  const showNextLevel = level < 10; // Only show next level if not max level
  const nextLevel = level + 1;
  const nextLevelTitle = {
    1: "First Steps",
    2: "Sand Grabber",
    3: "Determined",
    4: "Achiever",
    5: "Winner",
    6: "Celebrated",
    7: "Success Story",
    8: "Victory Kid",
    9: "Legendary",
    10: ""
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Level Benefits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Benefits */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm font-medium">
              Level {level}
            </span>
            <h3 className="font-semibold">{title}</h3>
          </div>
          
          <ul className="space-y-1.5">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start">
                <svg 
                  className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Next Level Benefits - only show if not max level */}
        {showNextLevel && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-sm">
                Level {nextLevel}
              </span>
              <h3 className="font-medium text-muted-foreground">{nextLevelTitle[level as keyof typeof nextLevelTitle]}</h3>
            </div>
            
            <ul className="space-y-1.5 text-muted-foreground">
              {nextLevelBenefits[level as keyof typeof nextLevelBenefits].map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <svg 
                    className="w-5 h-5 mr-2 text-muted-foreground flex-shrink-0 mt-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Max Level Message */}
        {!showNextLevel && (
          <div className="bg-success/10 text-success p-3 rounded-md text-sm flex items-center mt-4">
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Congratulations! You've reached the maximum level.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
