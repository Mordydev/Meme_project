'use client';

import React, { useState, useRef } from 'react';
import { useVotePost, useReportContent } from '@/hooks/queries/useCommunity';
import { Post } from '@/types';

interface PostActionsProps {
  post: Post;
  onShareClick?: () => void;
}

/**
 * Component containing post action buttons (vote, comment, share, report)
 */
export function PostActions({ post, onShareClick }: PostActionsProps) {
  const { id, voteCount, userVote, commentCount } = post;
  const { mutate: votePost } = useVotePost();
  const { mutate: reportContent, isLoading: isReporting } = useReportContent();
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  
  // Handle post voting
  const handleVote = (direction: 'up' | 'down') => {
    // Toggle vote if already voted in this direction
    const newDirection = userVote === direction ? null : direction;
    votePost({ postId: id, direction: newDirection });
  };
  
  // Handle post sharing
  const handleShare = () => {
    if (onShareClick) {
      onShareClick();
      return;
    }
    
    // Fallback share implementation
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `Check out this post on Success Kid: ${post.title}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      
      // Show temporary toast/tooltip
      const tooltip = document.createElement('div');
      tooltip.textContent = 'Link copied!';
      tooltip.className = 'absolute -top-10 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-sm py-1 px-2 rounded';
      
      if (shareButtonRef.current) {
        shareButtonRef.current.appendChild(tooltip);
        setTimeout(() => {
          tooltip.remove();
        }, 2000);
      }
    }
  };
  
  // Handle post reporting
  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason) return;
    
    reportContent({
      contentId: id,
      contentType: 'post',
      reason: reportReason,
      details: reportDetails || undefined
    }, {
      onSuccess: () => {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReportOpen(false);
          setReportSuccess(false);
          setReportReason('');
          setReportDetails('');
        }, 2000);
      }
    });
  };
  
  return (
    <div className="py-4 border-t border-b my-6">
      <div className="flex justify-between">
        <div className="flex space-x-6">
          {/* Upvote */}
          <button 
            className={`flex items-center hover:text-foreground ${userVote === 'up' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => handleVote('up')}
            aria-label="Upvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
            </svg>
            <span>Upvote</span>
            <span className="ml-1.5 bg-muted px-1.5 py-0.5 rounded-full text-xs">
              {voteCount}
            </span>
          </button>
          
          {/* Downvote */}
          <button 
            className={`flex items-center hover:text-foreground ${userVote === 'down' ? 'text-alert font-medium' : 'text-muted-foreground'}`}
            onClick={() => handleVote('down')}
            aria-label="Downvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5 rotate-180">
              <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
            </svg>
            <span>Downvote</span>
          </button>
          
          {/* Comments */}
          <button 
            className="flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 45.46 45.46 0 003.551-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A45.448 45.448 0 0010 2z" clipRule="evenodd" />
            </svg>
            <span>Comments</span>
            <span className="ml-1.5 bg-muted px-1.5 py-0.5 rounded-full text-xs">
              {commentCount}
            </span>
          </button>
        </div>
        
        <div className="flex space-x-2">
          {/* Share button */}
          <button 
            ref={shareButtonRef}
            className="flex items-center text-muted-foreground hover:text-foreground relative"
            onClick={handleShare}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path d="M13 4.5a2.5 2.5 0 11.5 0H13v5.5a2.5 2.5 0 002.5 2.5H19v-1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5zm-11 10a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5H7v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5V1.5a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5H1.5a2.5 2.5 0 01.5 0H7v5.5a.5.5 0 01-.5.5H3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 01.5.5V19H1.5a.5.5 0 010-1H12v-5.5a.5.5 0 01.5-.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-3a.5.5 0 01-.5-.5V4.5z" />
            </svg>
            <span>Share</span>
          </button>
          
          {/* Report button */}
          <button 
            className="flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setIsReportOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
            <span>Report</span>
          </button>
        </div>
      </div>
      
      {/* Report Dialog */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Report Post</h3>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {reportSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Thank you for reporting</h3>
                <p className="text-muted-foreground">Our moderation team will review this post.</p>
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Reason for reporting</label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="false_information">False Information</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Additional details (optional)</label>
                  <textarea
                    className="w-full p-2 border rounded-md bg-background"
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Please provide any additional information..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason || isReporting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                  >
                    {isReporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostActions;
