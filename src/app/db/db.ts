import { UserRole, UserStatus, User } from "../models";
import bcrypt from "bcrypt";
import config from "../../config";
import { IAdmin } from "./db.interface";

export const initiateSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash(
    "12345678",
    Number(config.bcrypt_salt_rounds)
  );
  const payload: IAdmin = {
    userName: "Dr. Irene Hamrick",
    email: "irene.hamrick@gmail.com",
    phoneNumber: "0123456789",
    location: "New York",
    profilePicture: "",
    password: hashedPassword,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  };

  const isExistUser = await User.findOne({
    email: payload.email,
  });

  if (isExistUser) {
    console.log("Super Admin already exists:", payload.email);
    return;
  }

  await User.create(payload);
  console.log("Super Admin created successfully:", payload.email);
};

const dbService = {
  initiateSuperAdmin,
};

export default dbService;
