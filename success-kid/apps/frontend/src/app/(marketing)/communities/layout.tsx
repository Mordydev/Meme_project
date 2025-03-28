import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Success Kid Community',
  description: 'Join the Success Kid community, participate in discussions, and earn rewards for your contributions.'
};

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>{children}</div>
  );
}
