import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SearchService } from "./search.service";
import { ISearchQuery } from "./search.interface";

const globalSearch = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    type: req.query.type ? (req.query.type as string).split(",") : undefined,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    status:
      req.query.status === "true"
        ? true
        : req.query.status === "false"
        ? false
        : undefined,
  };

  const searchQuery: ISearchQuery = {
    keyword: req.query.keyword as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    filters: filters as any,
  };

  const result = await SearchService.globalSearch(searchQuery);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search results retrieved successfully",
    data: result,
  });
});

export const SearchController = {
  globalSearch,
};
