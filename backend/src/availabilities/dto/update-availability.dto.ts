import { PartialType } from '@nestjs/mapped-types';
import { CreateAvailabilityDto } from './create-availability.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateAvailabilityDto extends PartialType(
  OmitType(CreateAvailabilityDto, ['serviceId'] as const),
) {}
