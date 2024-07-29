import { Schema, model } from 'mongoose';

export interface IUserProfile {
  userId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  address: string;
  dob: Date | null;
  gender: string;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    firstName: {
      type: String,
      default: '',
    },
    lastName: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const UserProfile = model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
