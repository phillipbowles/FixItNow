import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class TypingEventDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsBoolean()
  @IsNotEmpty()
  isTyping: boolean;
}
