import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { notificationService } from "./notification.service";

const sendNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.sendToSubscribers();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Notifications sent to all RSS Feed registered users about your new activity",
    data: result,
  });
});

export const notificationController = {
  sendNotifications,
};
