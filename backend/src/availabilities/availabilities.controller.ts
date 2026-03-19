import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  create(@GetUser('id') userId: string, @Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilitiesService.create(userId, createAvailabilityDto);
  }

  @Get()
  findByService(@Query('serviceId') serviceId: string) {
    return this.availabilitiesService.findByService(serviceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.availabilitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilitiesService.update(id, userId, updateAvailabilityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.availabilitiesService.remove(id, userId);
  }
}
