// Shared API response types and utilities

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Standard error codes
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// Helper functions for consistent responses
export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return { success: true, data, ...(message && { message }) };
}

export function errorResponse(
  message: string,
  errors?: Array<{ field?: string; message: string }>
): ApiErrorResponse {
  return { success: false, message, ...(errors && { errors }) };
}

