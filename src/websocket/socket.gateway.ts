import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  @WebSocketServer()
  server: Server;

  // store connected users with their socket IDs
  private connectedClients = new Map<
    string,
    { id: string;  }
  >();

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers['authorization'] as string)?.split(' ')[1];
    const secret = this.config.get<string>('JWT_SECRET');

    if (!token) {
      console.log('No token provided');
      client.disconnect();
      return; 
    }
    if (!secret) {
      console.log('JWT_SECRET not set in environment');
      client.disconnect();
      return;
    }

    try {
      const payload: any = jwt.verify(token, secret);
      
      this.connectedClients.set(client.id, {
        id: payload.id,
      });

      client.data.user = payload;      

      console.log(`User connected: ${payload.id}`);
    } catch (err) {
      console.log(`Invalid token for client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // emit to all clients
  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // emit to specific socket ID
  emitToClient(socketId: string, event: string, data: any) {
    this.server.to(socketId).emit(event, data);
  }

  // emit to event name with data
  emitToEventName(payload: { eventName: string; data: any }) {
    const { eventName, data } = payload;

    if (!eventName) {
      console.log('WebSocket emit skipped: Missing event name');
      return;
    }

    this.server.emit(eventName, {
      ...data,
      updatedDetail: data.updatedDetail ? data.updatedDetail : false
    });
  }


}
