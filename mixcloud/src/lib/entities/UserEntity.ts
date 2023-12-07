export interface UserEntity {
  type: 'user';
  username: string;
  url?: string;
  name?: string;
  thumbnail?: string;
  about?: string;
  location?: string;
}
