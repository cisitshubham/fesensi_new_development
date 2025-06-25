interface IResponse {
  success: boolean;
  message?: string;
  data: object | null | any|[];
}

export type ErrorResponse = IResponse & {
  error_code: number;
};

export const createResponse = (
  data: IResponse["data"],
  message?: string
): IResponse => {
  return { 
	  success: true, 
	  message, 
	  data,
	};
};


export const createErrorResponse = (
  error_code: number,
  message: string,
  data?: object,) =>{
	return {
		success: false,
        error_code,
        message,
        data,
  }
}

export const createPaginationResponse = (
  data: IResponse["data"],
  totalCount: number,
  currentPage: number,
  pageSize: number,
  message?: string,
  ) => {
	return {
		success: true,
        message,
        data: {
			totalCount,
            currentPage,
            pageSize,
            items: data,
		}}
}


export const createErrorPaginationResponse = (
  error_code: number,
  message: string,
  totalCount: number,
  currentPage: number,
  pageSize: number,
  data?: object,
) => {
	return {
        success: false,
        error_code,
        message,
        data: {
            totalCount,
            currentPage,
            pageSize,
            items: data,
        }}
}

export const createEmptyResponse = (): IResponse => {
	return {
        success: true,
        message: "No data found",
        data: [],
    }
}