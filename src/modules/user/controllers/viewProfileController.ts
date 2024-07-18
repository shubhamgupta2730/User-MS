import { Request, Response } from 'express';
import UserProfile, { IUserProfile } from '../../../models/userProfileModel';

export const viewProfile = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  try {
    let userProfile: IUserProfile | null = await UserProfile.findOne({ userId });

    if (!userProfile) {
      const newProfileData: IUserProfile = {
        userId,
        firstName: '',
        lastName: '',
        address: '',
        dob: null,
        gender: '',
      };

      userProfile = await UserProfile.create(newProfileData);
    }

    res.status(200).json({ userProfile });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Failed to get profile.' });
  }
};
