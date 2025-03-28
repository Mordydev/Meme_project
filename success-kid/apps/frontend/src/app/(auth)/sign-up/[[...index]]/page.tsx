'use client';

import { SignUp } from '@clerk/nextjs';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  return (
    <motion.div
      className="w-full max-w-md px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Clean card with no extra border */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Clerk component with styling */}
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none bg-transparent p-4",
              headerTitle: "text-primary-600 text-center text-2xl",
              headerSubtitle: "text-center text-gray-500",
              formButtonPrimary: 
                "bg-primary hover:bg-primary-600 text-white shadow-sm transition-all",
              formFieldInput: 
                "rounded border-gray-200 focus:border-primary-400 focus:ring focus:ring-primary-200 focus:ring-opacity-50",
              footerActionLink: "text-primary hover:text-primary-700",
              socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
              identityPreviewEditButton: "text-primary"
            },
            layout: {
              socialButtonsVariant: 'iconButton',
            }
          }}
          routing="path"
          path="/sign-up"
          redirectUrl="/" // Ensure redirect goes to root, not /home
        />
      </div>
    </motion.div>
  );
}
