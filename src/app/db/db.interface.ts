import { UserRole, UserStatus } from "../models";

export interface IAdmin {
  userName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  profilePicture?: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}
