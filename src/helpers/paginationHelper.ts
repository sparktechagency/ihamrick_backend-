type IOptions = {
  page?: number;
  limit?: number;
  sortOrder?: string;
  sortBy?: string;
};

type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
};

const calculatePagination = (options: IOptions): IOptionsResult => {
  // Only apply pagination if page or limit is explicitly provided
  const page: number = options.page ? Number(options.page) : 1;
  const limit: number = options.limit ? Number(options.limit) : 0; // 0 means no limit
  const skip: number = limit > 0 ? (page - 1) * limit : 0;

  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelper = {
  calculatePagination,
};
