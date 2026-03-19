import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify that a user has access to a booking's chat
   * User must be either the consumer or the provider of the service
   */
  async verifyBookingAccess(
    bookingId: string,
    userId: string,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isConsumer = booking.consumerId === userId;
    const isProvider = booking.service.providerId === userId;

    if (!isConsumer && !isProvider) {
      throw new ForbiddenException(
        'You do not have access to this booking chat',
      );
    }

    return true;
  }

  /**
   * Create a new message in the database
   */
  async createMessage(bookingId: string, senderId: string, content: string) {
    // Verify access before creating message
    await this.verifyBookingAccess(bookingId, senderId);

    const message = await this.prisma.message.create({
      data: {
        bookingId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get all messages for a booking
   */
  async getMessages(bookingId: string, userId: string) {
    // Verify access before retrieving messages
    await this.verifyBookingAccess(bookingId, userId);

    const messages = await this.prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string) {
    // First, verify that all messages belong to bookings the user has access to
    const messages = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
      },
      include: {
        booking: {
          include: {
            service: true,
          },
        },
      },
    });

    // Verify access for each message's booking
    for (const message of messages) {
      const isConsumer = message.booking.consumerId === userId;
      const isProvider = message.booking.service.providerId === userId;

      if (!isConsumer && !isProvider) {
        throw new ForbiddenException(
          'You do not have access to mark these messages as read',
        );
      }

      // Users can only mark messages as read if they are the recipient (not the sender)
      if (message.senderId === userId) {
        throw new ForbiddenException('You cannot mark your own messages as read');
      }
    }

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        isRead: true,
      },
    });

    return { success: true, count: messageIds.length };
  }

  /**
   * Get unread message count for a user across all their bookings
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all booking IDs where user is involved
    let bookingIds: string[] = [];

    if (user.role === UserRole.CONSUMER) {
      const bookings = await this.prisma.booking.findMany({
        where: { consumerId: userId },
        select: { id: true },
      });
      bookingIds = bookings.map((b) => b.id);
    } else if (user.role === UserRole.PROVIDER) {
      const bookings = await this.prisma.booking.findMany({
        where: {
          service: {
            providerId: userId,
          },
        },
        select: { id: true },
      });
      bookingIds = bookings.map((b) => b.id);
    }

    // Count unread messages in these bookings where user is NOT the sender
    const unreadCount = await this.prisma.message.count({
      where: {
        bookingId: { in: bookingIds },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return unreadCount;
  }

  /**
   * Get booking details with participant information
   */
  async getBookingDetails(bookingId: string, userId: string) {
    await this.verifyBookingAccess(bookingId, userId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        consumer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return booking;
  }
}
