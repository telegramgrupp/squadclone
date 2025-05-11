import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { psqlClient } from '../config/database';

interface User {
  userId: string;
  socketId: string;
  interests?: string[];
  age?: number;
  isPremium?: boolean;
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
}

class MatchHandler {
  private io: Server;
  private waitingUsers: User[] = [];
  private activeMatches: Map<string, Match> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Initialize socket event listeners for matching system
   * @param socket Connected socket instance
   */
  public initialize(socket: Socket): void {
    socket.on('findMatch', (userData: User) => this.handleFindMatch(socket, userData));
    socket.on('endMatch', (matchId: string) => this.handleEndMatch(socket, matchId));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Handle new match request from user
   * @param socket User's socket connection
   * @param userData User data including ID and preferences
   */
  private async handleFindMatch(socket: Socket, userData: User): Promise<void> {
    try {
      // Remove user from waiting list if already there
      this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== socket.id);

      // Find suitable match from waiting users
      const match = this.findSuitableMatch(userData);

      if (match) {
        // Create match if found suitable user
        await this.createMatch(match, userData);
      } else {
        // Add to waiting list if no match found
        this.waitingUsers.push({
          userId: userData.userId,
          socketId: socket.id,
          interests: userData.interests,
          age: userData.age,
          isPremium: userData.isPremium
        });
        
        // Emit waiting status
        socket.emit('matchStatus', { status: 'waiting' });
      }
    } catch (error) {
      console.error('Error in handleFindMatch:', error);
      socket.emit('matchError', { message: 'Failed to find match' });
    }
  }

  /**
   * Find suitable match from waiting users
   * @param userData User data to match
   * @returns Matched user or null
   */
  private findSuitableMatch(userData: User): User | null {
    // Basic matching for now - can be extended with filters
    return this.waitingUsers[0] || null;

    // Future premium matching logic example:
    /*
    if (userData.isPremium) {
      return this.waitingUsers.find(user => 
        user.age >= userData.minAge &&
        user.age <= userData.maxAge &&
        this.hasCommonInterests(user.interests, userData.interests)
      );
    }
    */
  }

  /**
   * Create and initialize new match between users
   * @param user1 First user
   * @param user2 Second user
   */
  private async createMatch(user1: User, user2: User): Promise<void> {
    const matchId = uuidv4();
    const match: Match = {
      matchId,
      user1Id: user1.userId,
      user2Id: user2.userId,
      socketId1: user1.socketId,
      socketId2: user2.socketId,
      isFake: false, // Set based on your fake user logic
      startTime: new Date(),
    };

    // Store match in memory
    this.activeMatches.set(matchId, match);

    // Remove matched user from waiting list
    this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== user1.socketId);

    // Notify both users
    const matchData = {
      matchId,
      isFake: match.isFake,
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

    // Store match in database
    await this.saveMatchToDatabase(match);
  }

  /**
   * Handle match end request
   * @param socket User's socket connection
   * @param matchId Match ID to end
   */
  private async handleEndMatch(socket: Socket, matchId: string): Promise<void> {
    try {
      const match = this.activeMatches.get(matchId);
      if (!match) return;

      match.endTime = new Date();
      match.duration = match.endTime.getTime() - match.startTime.getTime();

      // Update database
      await this.updateMatchInDatabase(match);

      // Notify both users
      this.io.to(match.socketId1).emit('matchEnded', { matchId, duration: match.duration });
      this.io.to(match.socketId2).emit('matchEnded', { matchId, duration: match.duration });

      // Clean up
      this.activeMatches.delete(matchId);
    } catch (error) {
      console.error('Error in handleEndMatch:', error);
      socket.emit('matchError', { message: 'Failed to end match' });
    }
  }

  /**
   * Handle user disconnect
   * @param socket Disconnected socket
   */
  private handleDisconnect(socket: Socket): void {
    // Remove from waiting list
    this.waitingUsers = this.waitingUsers.filter(u => u.socketId !== socket.id);

    // End any active matches
    for (const [matchId, match] of this.activeMatches.entries()) {
      if (match.socketId1 === socket.id || match.socketId2 === socket.id) {
        this.handleEndMatch(socket, matchId);
      }
    }
  }

  /**
   * Save new match to database
   * @param match Match data to save
   */
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

  /**
   * Update existing match in database
   * @param match Updated match data
   */
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