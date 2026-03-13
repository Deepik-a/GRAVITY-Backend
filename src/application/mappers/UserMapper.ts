import { UserProfile } from "@/domain/entities/User";
import { UserListResponseDto } from "@/application/dtos/admin/UserListResponseDto";

export const UserMapper = {
  toUserListResponseDto(user: UserProfile): UserListResponseDto {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      location: user.location,
      bio: user.bio,
      phone: user.phone,
      role: user.role || "user",
      bookingCount: user.bookingCount || 0,
      isBlocked: user.isBlocked || false,
    };
  }
};
