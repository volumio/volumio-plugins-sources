interface UserEntity {
  id?: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  thumbnail?: string | null;
  permalink?: string | null;
  location?: string | null;
}

export default UserEntity;
