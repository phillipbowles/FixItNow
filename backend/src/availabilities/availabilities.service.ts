import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAvailabilityDto: CreateAvailabilityDto) {
    const { serviceId, startTime, endTime, ...rest } = createAvailabilityDto;

    // Verify service exists and belongs to the user
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== userId) {
      throw new ForbiddenException('You can only add availability to your own services');
    }

    // Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    return this.prisma.availability.create({
      data: {
        serviceId,
        startTime,
        endTime,
        ...rest,
      },
    });
  }

  async findByService(serviceId: string) {
    return this.prisma.availability.findMany({
      where: { serviceId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    return availability;
  }

  async update(id: string, userId: string, updateAvailabilityDto: UpdateAvailabilityDto) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    if (availability.service.providerId !== userId) {
      throw new ForbiddenException('You can only update your own service availabilities');
    }

    // Validate time range if both times are provided
    const startTime = updateAvailabilityDto.startTime || availability.startTime;
    const endTime = updateAvailabilityDto.endTime || availability.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    return this.prisma.availability.update({
      where: { id },
      data: updateAvailabilityDto,
    });
  }

  async remove(id: string, userId: string) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    if (availability.service.providerId !== userId) {
      throw new ForbiddenException('You can only delete your own service availabilities');
    }

    return this.prisma.availability.delete({
      where: { id },
    });
  }
}
