export interface GetUserProfileRequestDto {
  id: string;
}

export interface UpdateUserProfileRequestDto {
  id: string;
  name?: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
}
