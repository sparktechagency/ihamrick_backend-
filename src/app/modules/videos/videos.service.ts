import mongoose from "mongoose";
import { Video, IVideo } from "./videos.model";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { deleteFromGCS } from "../../../helpers/googleCloudStorage";

interface IVideoFilter {
  searchTerm?: string;
  status?: string;
  uploadDateFrom?: string;
  uploadDateTo?: string;
}

const createIntoDb = async (data: Partial<IVideo>) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Convert uploadDate string to Date if needed
    if (data.uploadDate && typeof data.uploadDate === "string") {
      data.uploadDate = new Date(data.uploadDate);
    }

    // Sanitize HTML content if needed
    if (data.description) {
      data.description = data.description.trim();
    }
    if (data.transcription) {
      data.transcription = data.transcription.trim();
    }

    const result = await Video.create([data], { session });

    await session.commitTransaction();
    return result[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getListFromDb = async (
  filters: IVideoFilter,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, status, uploadDateFrom, uploadDateTo } = filters;

  const andConditions = [];

  // Search by title or description
  if (searchTerm) {
    andConditions.push({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    });
  }

  // Filter by status
  if (status !== undefined) {
    andConditions.push({ status: status === "true" });
  }

  // Filter by upload date range
  if (uploadDateFrom || uploadDateTo) {
    const dateFilter: any = {};
    if (uploadDateFrom) {
      dateFilter.$gte = new Date(uploadDateFrom);
    }
    if (uploadDateTo) {
      dateFilter.$lte = new Date(uploadDateTo);
    }
    andConditions.push({ uploadDate: dateFilter });
  }

  // Always exclude deleted videos
  andConditions.push({ isDeleted: false });

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  // Pagination
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === "asc" ? 1 : -1;
  } else {
    sortConditions.uploadDate = -1; // Default: newest first
  }

  const result = await Video.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Video.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getByIdFromDb = async (id: string, incrementView: boolean = false) => {
  const result = await Video.findById(id);

  if (!result || result.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
  }

  // Increment view count if requested
  if (incrementView) {
    result.views += 1;
    await result.save();
  }

  return result;
};

const updateIntoDb = async (id: string, data: Partial<IVideo>) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Prevent updating sensitive fields
    const updateData: any = { ...data };
    delete updateData.videoUrl;
    delete updateData.thumbnailUrl;
    delete updateData.fileName;
    delete updateData.fileSize;
    delete updateData.contentType;
    delete updateData.views;
    delete updateData.isDeleted;

    // Convert uploadDate string to Date if needed
    if (updateData.uploadDate && typeof updateData.uploadDate === "string") {
      updateData.uploadDate = new Date(updateData.uploadDate);
    }

    const result = await Video.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, session, runValidators: true }
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
    }

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteItemFromDb = async (id: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Get video details first
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
    }

    // Soft delete in database
    const result = await Video.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true, session }
    );

    await session.commitTransaction();

    // Delete from Google Cloud Storage (async, don't block response)
    try {
      if (video.videoUrl) {
        await deleteFromGCS(video.videoUrl);
      }
      if (video.thumbnailUrl) {
        await deleteFromGCS(video.thumbnailUrl);
      }
    } catch (gcsError) {
      console.error("Failed to delete from GCS:", gcsError);
      // Continue - database soft delete succeeded
    }

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const videosService = {
  createIntoDb,
  getListFromDb,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
