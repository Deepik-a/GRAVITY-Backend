export interface UserListResponseDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  isBlocked?: boolean;
  role: string;
  bookingCount: number;
}
