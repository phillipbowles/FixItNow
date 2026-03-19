import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        providerId,
      },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(userId?: string, userRole?: UserRole) {
    // If user is a provider, show only their services
    if (userRole === UserRole.PROVIDER && userId) {
      return this.prisma.service.findMany({
        where: {
          providerId: userId,
        },
        include: {
          provider: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          availabilities: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // For consumers or public, show only active services
    return this.prisma.service.findMany({
      where: {
        isActive: true,
      },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        availabilities: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
          },
        },
        availabilities: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, userId: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== userId) {
      throw new ForbiddenException('You can only update your own services');
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        availabilities: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== userId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
