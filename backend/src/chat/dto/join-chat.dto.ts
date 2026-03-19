import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinChatDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;
}
