import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as admin from 'firebase-admin';
import { MessageResponse } from 'src/common/response';
import { SocketGateway } from 'src/websocket/socket.gateway';

@Injectable()
export class FcmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {
    // This should be initialized only once
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : '',
        }),
      });
    }
  }

  getMessaging() {
    return admin.messaging();
  }

  async updateFcmToken(
    userId: string,
    token: string,
  ): Promise<MessageResponse> {
    try {
      console.log('updateFcmToken dto', userId, token);

      const userExists = await this.prisma.user.findUnique({
        where: { id: userId, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!userExists) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const existingToken = await this.prisma.fcmToken.findFirst({
        where: { token },
      });

      if (existingToken) {
        const updatedToken = await this.prisma.fcmToken.update({
          where: { id: existingToken.id },
          data: {
            user: {
              connect: { id: userId },
            },
          },
        });
        console.log('updateFcmToken existing token');
      } else {
        const createToken = await this.prisma.fcmToken.create({
          data: {
            token,
            user: {
              connect: { id: userId },
            },
          },
        });
        console.log('updateFcmToken new token');
      }

      return { message: 'FCM token updated successfully' };
    } catch (error) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async sendPushNotification({
    id,
    title,
    body,
    ttl = 60 * 60 * 24 * 7, // 7 days
    data,
    priority,
  }: {
    id: string;
    title: string;
    body: string;
    ttl?: number;
    data?: Record<string, string> | null;
    priority?: string;
  }) {
    try {
      console.log('push notification: ', title);

      const tokens = await this.prisma.fcmToken.findMany({
        where: { userId: id },
        select: { token: true, userId: true },
      });

      if (tokens.length === 0) {
        console.warn('No FCM tokens found for user ID:', id);
        return;
      }

      const androidPriority = priority === 'high' ? 'high' : 'normal';
      const apnsPriority = priority === 'high' ? '10' : '5';
      const apnsExpiration = Math.floor(Date.now() / 1000) + ttl;

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.map((t) => t.token),
        notification: { title, body },
        data: { ...data },
        android: {
          priority: androidPriority,
          ttl,
        },
        apns: {
          headers: {
            'apns-priority': apnsPriority,
            'apns-expiration': apnsExpiration.toString(),
          },
          payload: {
            aps: {
              alert: { title, body },
            },
          },
        },
      };

      const response = await this.getMessaging().sendEachForMulticast(message);

      const failedTokens = response.responses
        .map((r, i) => (!r.success ? tokens[i].token : null))
        .filter(Boolean);

      if (failedTokens.length > 0) {
        await this.prisma.fcmToken.deleteMany({
          where: { token: { in: failedTokens as string[] } },
        });
        console.warn(`Removed ${failedTokens.length} invalid FCM tokens.`);
      }
      return { message: 'Push notification sent successfully' };
    } catch (error) {
      console.error('Firebase send error:', error);
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async sendTodoNotification(data: {
    userId: string,
    tankId: string,
    tankName: string,
    todoId: string,
    message: string | null,
    createdAt: Date | null,
    deleted?: boolean,
  }
  ): Promise<MessageResponse> {
    try {
      if(!data.deleted && data.message){
      // send fcm notification
      await this.sendPushNotification({
        id: data.userId,
        title: `긴급 작업이 있습니다`,
        body: data.message,
        priority: 'high',
      });
    }

      const count = await this.prisma.todo.count({
        where: {
          tank: { userId: data.userId },
        },
      });

      // send web socket notification
      this.socketGateway.emitTodoToUser({
        userId: data.userId,
        data: {
          id: data.todoId,
          message: data.message,
          createdAt: data.createdAt,
          totalTodo: count,
          flag: data.deleted ? 'DELETE' : 'CREATE',
        }
      });
      return { message: 'Todo notification has been sent successfully' };
    } catch (error) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}
