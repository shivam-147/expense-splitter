export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
  }
}

export interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ErrorResponse {
  success: false;

  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };

  meta: {
    request_id: string;
    timestamp: string;
  }
}
