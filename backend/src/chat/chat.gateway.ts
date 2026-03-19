import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto, TypingEventDto, JoinChatDto, MarkReadDto } from './dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socket IDs

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Handle client connection with JWT authentication
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });

      // Store user info in socket data
      client.data.userId = payload.sub;
      client.data.email = payload.email;

      // Track user's socket connections
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub).add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);

      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Extract JWT token from handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check query parameters as fallback
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    return token as string || null;
  }

  /**
   * Join a booking's chat room
   */
  @SubscribeMessage('join_booking_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinChatDto,
  ) {
    try {
      const userId = client.data.userId;
      const { bookingId } = data;

      // Verify access to booking
      await this.chatService.verifyBookingAccess(bookingId, userId);

      // Join the room
      const roomName = `booking:${bookingId}`;
      client.join(roomName);

      this.logger.log(`User ${userId} joined chat for booking ${bookingId}`);

      // Load and send chat history
      const messages = await this.chatService.getMessages(bookingId, userId);
      const bookingDetails = await this.chatService.getBookingDetails(bookingId, userId);

      client.emit('chat_history', {
        bookingId,
        messages,
        booking: bookingDetails,
      });

      // Notify other participants that user joined
      client.to(roomName).emit('user_joined', {
        bookingId,
        userId,
      });

      return { success: true, roomName };
    } catch (error) {
      this.logger.error(`Join chat error: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave a booking's chat room
   */
  @SubscribeMessage('leave_booking_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinChatDto,
  ) {
    try {
      const userId = client.data.userId;
      const { bookingId } = data;

      const roomName = `booking:${bookingId}`;
      client.leave(roomName);

      this.logger.log(`User ${userId} left chat for booking ${bookingId}`);

      // Notify other participants
      client.to(roomName).emit('user_left', {
        bookingId,
        userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Leave chat error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message in a booking's chat
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId;
      const { bookingId, content } = data;

      // Create message in database
      const message = await this.chatService.createMessage(
        bookingId,
        userId,
        content,
      );

      const roomName = `booking:${bookingId}`;

      // Broadcast to all clients in the room (including sender)
      this.server.to(roomName).emit('new_message', message);

      // ALSO emit to all participant sockets (consumer and provider) even if they're not in the room
      // This ensures notifications work even when users are in different chats
      const bookingDetails = await this.chatService.getBookingDetails(bookingId, userId);

      if (bookingDetails) {
        const participantIds = [
          bookingDetails.consumerId,
          bookingDetails.service.providerId,
        ];

        // Emit to all sockets of all participants, BUT only if they're NOT already in the room
        // This prevents duplicate messages for users who are actively in the chat
        for (const participantId of participantIds) {
          const socketIds = this.userSockets.get(participantId);
          if (socketIds) {
            for (const socketId of socketIds) {
              const socket = this.server.sockets.sockets.get(socketId);
              // Only emit if socket exists and is NOT already in the room
              if (socket && !socket.rooms.has(roomName)) {
                this.server.to(socketId).emit('new_message', message);
              }
            }
          }
        }
      }

      this.logger.log(`Message sent in booking ${bookingId} by user ${userId}`);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingEventDto,
  ) {
    try {
      const userId = client.data.userId;
      const { bookingId, isTyping } = data;

      // Verify access to booking
      await this.chatService.verifyBookingAccess(bookingId, userId);

      const roomName = `booking:${bookingId}`;

      // Broadcast typing status to other participants (not to sender)
      client.to(roomName).emit('user_typing', {
        bookingId,
        userId,
        isTyping,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Typing event error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkReadDto,
  ) {
    try {
      const userId = client.data.userId;
      const { messageIds } = data;

      const result = await this.chatService.markMessagesAsRead(messageIds, userId);

      // Get the booking ID from one of the messages to notify the sender
      if (messageIds.length > 0) {
        const message = await this.chatService['prisma'].message.findUnique({
          where: { id: messageIds[0] },
          select: { bookingId: true, senderId: true },
        });

        if (message) {
          const roomName = `booking:${message.bookingId}`;

          // Notify the sender that their messages were read
          this.server.to(roomName).emit('messages_read', {
            bookingId: message.bookingId,
            messageIds,
            readBy: userId,
          });
        }
      }

      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Mark read error: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread message count for the current user
   */
  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      const count = await this.chatService.getUnreadMessageCount(userId);

      client.emit('unread_count', { count });

      return { success: true, count };
    } catch (error) {
      this.logger.error(`Get unread count error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
