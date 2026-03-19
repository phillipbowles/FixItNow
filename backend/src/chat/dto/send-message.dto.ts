import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
