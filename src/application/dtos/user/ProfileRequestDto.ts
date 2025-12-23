export interface GetUserProfileRequestDto {
  userId: string;
}

export interface UpdateUserProfileRequestDto {
  userId: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
}
