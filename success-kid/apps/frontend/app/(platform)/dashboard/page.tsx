import React from 'react';
import { DashboardHeader } from '@/components/layout';
import { PageLayout } from '@/components/layout';

/**
 * Dashboard Page - Example page using the navigation system
 */
export default function DashboardPage() {
  return (
    <PageLayout>
      <DashboardHeader 
        title="Dashboard" 
        description="Welcome to your Success Kid dashboard"
        action={
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Add Content
          </button>
        }
      />
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Cards */}
        <DashboardCard
          title="Success Points"
          value="2,450"
          trend="+15%"
          trendPositive={true}
          description="Total points earned"
        />
        
        <DashboardCard
          title="Community Rank"
          value="#42"
          trend="↑ 5"
          trendPositive={true}
          description="Weekly leaderboard"
        />
        
        <DashboardCard
          title="Token Balance"
          value="124 SKC"
          trend="$248.00"
          trendPositive={null}
          description="Current market value"
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="border rounded-md">
          {/* Activity Items */}
          <ActivityItem 
            title="Posted in Community" 
            description="How to use points effectively?"
            time="2 hours ago"
            tag="Community"
          />
          
          <ActivityItem 
            title="Points Earned" 
            description="+50 points for daily login streak"
            time="5 hours ago"
            tag="Points"
          />
          
          <ActivityItem 
            title="Achievement Unlocked" 
            description="Conversation Starter - Received 5 comments"
            time="1 day ago"
            tag="Achievement"
          />
        </div>
      </div>
    </PageLayout>
  );
}

// Dashboard card component
function DashboardCard({ 
  title, 
  value, 
  trend, 
  trendPositive, 
  description 
}: {
  title: string;
  value: string;
  trend: string;
  trendPositive: boolean | null;
  description: string;
}) {
  return (
    <div className="border rounded-md p-6 bg-card text-card-foreground">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {trend && (
          <span className={
            trendPositive === true 
              ? "text-green-600" 
              : trendPositive === false 
                ? "text-red-600" 
                : "text-muted-foreground"
          }>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

// Activity item component
function ActivityItem({ 
  title, 
  description, 
  time, 
  tag 
}: {
  title: string;
  description: string;
  time: string;
  tag: string;
}) {
  return (
    <div className="border-b last:border-0 p-4">
      <div className="flex justify-between">
        <h4 className="font-medium">{title}</h4>
        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
          {tag}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{time}</p>
    </div>
  );
}
