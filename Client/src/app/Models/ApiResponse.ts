export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  errors: string
  message: string;
}
