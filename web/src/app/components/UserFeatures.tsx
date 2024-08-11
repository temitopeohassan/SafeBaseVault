"use client"
import React from 'react';

interface UserFeaturesProps {
  scAddress: `0x${string}`;
  userAddress: string;
  quorem: number;
  isOwner: boolean;
}


export default function UserFeatures({ scAddress, userAddress, quorem, isOwner }: UserFeaturesProps) {
 


  return (
    <>
      <p>User features</p>
      
    </>
  );
}
