import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { psqlClient } from '../config/database';

// Fake users array
const fakeUsers = [
  { id: 'fake1', name: 'Emma Wilson', country: 'USA' },
  { id: 'fake2', name: 'David Chen', country: 'Canada' },
  { id: 'fake3', name: 'Sophia Lopez', country: 'Spain' },
  { id: 'fake4', name: 'James Brown', country: 'UK' },
  { id: 'fake5', name: 'Mia Johnson', country: 'Australia' },
  { id: 'fake6', name: 'Alex Kim', country: 'South Korea' },
  { id: 'fake7', name: 'Olivia Davis', country: 'France' },
  { id: 'fake8', name: 'Mohammed Al-Farsi', country: 'UAE' }
];

interface User {
  userId: string;
  socketId: string;
  interests?: string[];
  age?: number;
  isPremium?: boolean;
}

interface FakeUser {
  id: string;
  name: string;
  country: string;
}

interface Match {
  matchId: string;
  user1Id: string;
  user2Id: string;
  socketId1: string;
  socketId2: string;
  isFake: boolean;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  fakeUser?: FakeUser;
}

class MatchHandler {
  private io: Server;
  private waitingUsers: User[] = [];
  private activeMatches: Map<string, Match> = new Map();
  private usedFakeUsers: Set<string> = new Set();

  constructor(io: Server) {
    this.io = io;
  }

  public initialize(socket: Socket): void {
    socket.on('findMatch', (userData: User) => this.handleFindMatch(socket, userData));
    socket.on('endMatch', (matchId: string) => this.handleEndMatch(socket, matchId));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private getRandomFakeUser(): FakeUser | null {
    // Filter out used fake users
    const availableFakeUsers = fakeUsers.filter(user => !this.usedFakeUsers.has(user.id));
    
    // If all fake users are used, reset the used list
    if (availableFakeUsers.length === 0) {
      this.usedFakeUsers.clear();
      return fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    }
    
    // Get random available fake user
    const randomUser = availableFakeUsers[Math.floor(Math.random() * availableFakeUsers.length)];
    this.usedFakeUsers.add(randomUser.id);
    return randomUser;
  }

  private async createFakeMatch(userData: User): Promise<void> {
    const fakeUser = this.getRandomFakeUser();
    if (!fakeUser) return;

    const matchId = uuidv4();
    const match: Match = {
      matchId,
      user1Id: userData.userId,
      user2Id: fakeUser.id,
      socketId1: userData.socketId,
      socketId2: `fake-${fakeUser.id}`,
      isFake: true,
      startTime: new Date(),
      fakeUser
    };

    // Store match in memory
    this.activeMatches.set(matchId, match);

    // Notify user of match
    this.io.to(userData.socketId).emit('matched', {
      matchId,
      partnerId: fakeUser.id,
      isFake: true,
      fakeUser,
      startTime: match.startTime
    });

    // Store in database
    await this.saveMatchToDatabase(match);
  }

  private async handleFindMatch(socket: Socket, userData: User): Promise<void> {
    try {
      // Remove user from waiting list if already there
      this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== socket.id);

      // Find suitable match from waiting users
      const match = this.findSuitableMatch(userData);

      if (match) {
        // Create real match if found suitable user
        await this.createMatch(match, userData);
      } else {
        // Try to find match for 5 seconds before creating fake match
        socket.emit('matchStatus', { status: 'waiting' });
        
        this.waitingUsers.push({
          userId: userData.userId,
          socketId: socket.id,
          interests: userData.interests,
          age: userData.age,
          isPremium: userData.isPremium
        });

        // Wait for real match for 5 seconds
        setTimeout(async () => {
          // Check if user is still waiting
          const isStillWaiting = this.waitingUsers.some(u => u.socketId === socket.id);
          if (isStillWaiting) {
            // Remove from waiting list
            this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== socket.id);
            // Create fake match
            await this.createFakeMatch(userData);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Error in handleFindMatch:', error);
      socket.emit('matchError', { message: 'Failed to find match' });
    }
  }

  private findSuitableMatch(userData: User): User | null {
    return this.waitingUsers[0] || null;
  }

  private async createMatch(user1: User, user2: User): Promise<void> {
    const matchId = uuidv4();
    const match: Match = {
      matchId,
      user1Id: user1.userId,
      user2Id: user2.userId,
      socketId1: user1.socketId,
      socketId2: user2.socketId,
      isFake: false,
      startTime: new Date(),
    };

    this.activeMatches.set(matchId, match);
    this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== user1.socketId);

    const matchData = {
      matchId,
      isFake: false,
      startTime: match.startTime,
    };

    this.io.to(user1.socketId).emit('matched', {
      ...matchData,
      partnerId: user2.userId,
    });

    this.io.to(user2.socketId).emit('matched', {
      ...matchData,
      partnerId: user1.userId,
    });

    await this.saveMatchToDatabase(match);
  }

  private async handleEndMatch(socket: Socket, matchId: string): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) return;

      match.endTime = new Date();
      match.duration = match.endTime.getTime() - match.startTime.getTime();

      await this.updateMatchInDatabase(match);

      this.io.to(match.socketId1).emit('matchEnded', { 
        matchId, 
        duration: match.duration,
        isFake: match.isFake 
      });

      if (!match.isFake) {
        this.io.to(match.socketId2).emit('matchEnded', { 
          matchId, 
          duration: match.duration,
          isFake: match.isFake
        });
      }

      this.activeMatches.delete(matchId);
    } catch (error) {
      console.error('Error in handleEndMatch:', error);
      socket.emit('matchError', { message: 'Failed to end match' });
    }
  }

  private handleDisconnect(socket: Socket): void {
    this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== socket.id);

    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.socketId1 === socket.id || match.socketId2 === socket.id) {
        this.handleEndMatch(socket, matchId);
      }
    }
  }

  private async saveMatchToDatabase(match: Match): Promise<void> {
    try {
      await psqlClient.match.create({
        data: {
          id: match.matchId,
          userId: match.user1Id,
          matchedWith: match.user2Id,
          isFake: match.isFake,
          startTime: match.startTime,
        }
      });
    } catch (error) {
      console.error('Error saving match to database:', error);
    }
  }

  private async updateMatchInDatabase(match: Match): Promise<void> {
    try {
      await psqlClient.match.update({
        where: { id: match.matchId },
        data: {
          updatedAt: match.endTime,
        }
      });
    } catch (error) {
      console.error('Error updating match in database:', error);
    }
  }
}

export default MatchHandler;
