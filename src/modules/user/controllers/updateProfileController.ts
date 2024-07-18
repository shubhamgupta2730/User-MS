import { Request, Response } from 'express';
import UserProfile from '../../../models/userProfileModel';

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { firstName, lastName, address, dob, gender } = req.body;

  try {
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { firstName, lastName, address, dob, gender },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({ userProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};
