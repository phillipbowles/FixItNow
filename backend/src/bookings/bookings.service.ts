import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, UserRole, DayOfWeek } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(consumerId: string, createBookingDto: CreateBookingDto) {
    const { serviceId, date, startTime, endTime, notes } = createBookingDto;

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { availabilities: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not active');
    }

    // Prevent provider from booking their own service
    if (service.providerId === consumerId) {
      throw new BadRequestException('You cannot book your own service');
    }

    // Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate date is not in the past (compare in UTC to avoid timezone issues)
    const bookingDate = new Date(date + 'T00:00:00.000Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new BadRequestException('Cannot book dates in the past');
    }

    // Get day of week from date
    const dayOfWeek = this.getDayOfWeek(bookingDate);

    // Check if service has availability for this day and time
    const hasAvailability = service.availabilities.some(
      (avail) =>
        avail.dayOfWeek === dayOfWeek &&
        startTime >= avail.startTime &&
        endTime <= avail.endTime,
    );

    if (!hasAvailability) {
      throw new BadRequestException(
        'Service is not available for the selected day and time. Please check available hours.',
      );
    }

    // Check for conflicting bookings (same service, same date, overlapping time)
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        serviceId,
        date: bookingDate,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        OR: [
          {
            AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException(
        'This time slot is already booked. Please choose a different time.',
      );
    }

    // Create booking
    return this.prisma.booking.create({
      data: {
        serviceId,
        consumerId,
        date: bookingDate,
        startTime,
        endTime,
        notes,
      },
      include: {
        service: {
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
        },
        consumer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, userRole: UserRole) {
    if (userRole === UserRole.CONSUMER) {
      // Show bookings created by this consumer
      return this.prisma.booking.findMany({
        where: { consumerId: userId },
        include: {
          service: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userRole === UserRole.PROVIDER) {
      // Show bookings for services owned by this provider
      return this.prisma.booking.findMany({
        where: {
          service: {
            providerId: userId,
          },
        },
        include: {
          service: true,
          consumer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return [];
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const booking = await this.prisma.booking.findUnique({
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
                phone: true,
                address: true,
              },
            },
          },
        },
        consumer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check authorization
    const isConsumer = userRole === UserRole.CONSUMER && booking.consumerId === userId;
    const isProvider = userRole === UserRole.PROVIDER && booking.service.providerId === userId;

    if (!isConsumer && !isProvider) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    userId: string,
    userRole: UserRole,
    updateStatusDto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const { status } = updateStatusDto;

    // Authorization rules
    const isConsumer = userRole === UserRole.CONSUMER && booking.consumerId === userId;
    const isProvider = userRole === UserRole.PROVIDER && booking.service.providerId === userId;

    if (!isConsumer && !isProvider) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    // Consumers can only cancel their own bookings
    if (isConsumer && status !== BookingStatus.CANCELLED) {
      throw new ForbiddenException('Consumers can only cancel bookings');
    }

    // Providers can confirm, complete, or cancel
    if (isProvider) {
      if (
        status === BookingStatus.CONFIRMED &&
        booking.status !== BookingStatus.PENDING
      ) {
        throw new BadRequestException('Can only confirm pending bookings');
      }

      if (
        status === BookingStatus.COMPLETED &&
        booking.status !== BookingStatus.CONFIRMED
      ) {
        throw new BadRequestException('Can only complete confirmed bookings');
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: {
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
        },
        consumer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
          },
        },
      },
    });
  }

  async getServiceBookings(serviceId: string, date?: string) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Build where clause
    const where: any = {
      serviceId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
    };

    // Filter by date if provided
    if (date) {
      const bookingDate = new Date(date);
      where.date = bookingDate;
    }

    // Get bookings - only return minimal info (no consumer details)
    const bookings = await this.prisma.booking.findMany({
      where,
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return bookings;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const dayNumber = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (using UTC)
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[dayNumber];
  }
}
