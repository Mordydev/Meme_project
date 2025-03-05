import React from 'react';
import { Typography } from '../../atoms/Typography';

const Profile: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <Typography variant="h1" weight="bold" className="mb-6 text-center">
        Profile Page
      </Typography>
      <Typography variant="body" color="muted" className="text-center max-w-2xl mx-auto">
        This is a placeholder for the Profile page. It will be implemented in a future phase.
      </Typography>
    </div>
  );
};

export default Profile; 