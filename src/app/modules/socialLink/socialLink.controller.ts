import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { socialLinkService } from "./socialLink.service";

const createSocialLink = catchAsync(async (req, res) => {
  const socialLink = await socialLinkService.createSocialLink(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Social Link created successfully",
    data: socialLink,
  });
});

const getSocialLinkList = catchAsync(async (req, res) => {
  const socialLinks = await socialLinkService.getSocialLinkList();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Social Links retrieved successfully",
    data: socialLinks,
  });
});

const getSocialLinkById = catchAsync(async (req, res) => {
  const socialLink = await socialLinkService.getSocialLinkById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Social Link retrieved successfully",
    data: socialLink,
  });
});

const updateSocialLink = catchAsync(async (req, res) => {
  const socialLink = await socialLinkService.updateSocialLink(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Social Link updated successfully",
    data: socialLink,
  });
});

const deleteSocialLink = catchAsync(async (req, res) => {
  const socialLink = await socialLinkService.deleteSocialLink(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Social Link deleted successfully",
    data: socialLink,
  });
});

export const socialLinkController = {
  createSocialLink,
  getSocialLinkList,
  getSocialLinkById,
  updateSocialLink,
  deleteSocialLink,
};
