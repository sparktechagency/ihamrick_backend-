import mongoose from "mongoose";
import { SocialLink } from "./socialLink.model";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

const createSocialLink = async (data: { name: string; url: string }) => {
  const isExisting = await SocialLink.findOne({ name: data.name });
  if (isExisting) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Social Link with this name already exists"
    );
  }
  const socialLink = await SocialLink.create(data);
  return socialLink;
};

const getSocialLinkList = async () => {
  const socialLinks = await SocialLink.find();
  return socialLinks;
};

const getSocialLinkById = async (id: string) => {
  const socialLink = await SocialLink.findById(id);
  if (!socialLink) {
    throw new ApiError(httpStatus.NOT_FOUND, "Social Link not found");
  }
  return socialLink;
};

const updateSocialLink = async (
  id: string,
  data: Partial<{ name: string; url: string }>
) => {
  const socialLink = await SocialLink.findByIdAndUpdate(id, data, {
    new: true,
  });
  if (!socialLink) {
    throw new ApiError(httpStatus.NOT_FOUND, "Social Link not found");
  }
  return socialLink;
};

const deleteSocialLink = async (id: string) => {
  const socialLink = await SocialLink.findByIdAndDelete(id);
  if (!socialLink) {
    throw new ApiError(httpStatus.NOT_FOUND, "Social Link not found");
  }
  return socialLink;
};

export const socialLinkService = {
  createSocialLink,
  getSocialLinkList,
  getSocialLinkById,
  updateSocialLink,
  deleteSocialLink,
};
