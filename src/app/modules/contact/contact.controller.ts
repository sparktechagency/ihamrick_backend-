import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { contactService } from "./contact.service";
import { Request, Response } from "express";

const createContact = catchAsync(async (req: Request, res: Response) => {
  // Collect meta information
  const meta = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    referer: req.headers.referer,
  };

  // Merge meta data with request body
  const contactData = {
    ...req.body,
    meta,
  };

  await contactService.createContact(contactData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Thank you for your message! We'll get back to you soon.",
    data: null, // Don't expose the created document to the client
  });
});

export const contactController = {
  createContact,
};
