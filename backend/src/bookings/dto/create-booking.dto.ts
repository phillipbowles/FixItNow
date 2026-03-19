import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format (e.g., 2024-01-15)',
  })
  date: string; // Format: YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 10:00)',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 11:00)',
  })
  endTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
