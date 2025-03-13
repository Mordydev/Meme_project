'use client';

import React, { useState } from 'react';
import { useReportContent } from '@/hooks/queries/useCommunity';

interface ReportDialogProps {
  contentId: string;
  contentType: 'post' | 'comment';
  onClose: () => void;
  onSubmit?: () => void;
}

/**
 * Dialog for reporting content violations
 */
export function ReportDialog({ 
  contentId, 
  contentType, 
  onClose,
  onSubmit
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: reportContent, isLoading: isSubmitting } = useReportContent();
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) return;
    
    reportContent(
      { 
        contentId, 
        contentType, 
        reason, 
        details: details || undefined 
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          
          // Close dialog after showing success message
          setTimeout(() => {
            onClose();
            if (onSubmit) onSubmit();
          }, 2000);
        },
      }
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            Report {contentType === 'post' ? 'Post' : 'Comment'}
          </h2>
          
          <button 
            type="button" 
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Success state */}
        {isSuccess ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-foreground mb-2">Report submitted</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for helping keep our community safe. Our team will review this content.
            </p>
          </div>
        ) : (
          /* Report form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium mb-1">
                Reason for reporting <span className="text-alert">*</span>
              </label>
              
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or misleading</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="hate_speech">Hate speech or discrimination</option>
                <option value="explicit">Sexually explicit content</option>
                <option value="violence">Violence or harm</option>
                <option value="misinformation">Misinformation</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="report-details" className="block text-sm font-medium mb-1">
                Additional details (optional)
              </label>
              
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                rows={4}
                placeholder="Please provide any additional context that may help us understand the issue..."
              />
            </div>
            
            <div className="pt-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!reason || isSubmitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportDialog;
