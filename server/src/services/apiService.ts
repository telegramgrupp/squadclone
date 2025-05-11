import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/environment";
import { psqlClient } from "../config/database";

class ApiService {
  static async auth(req: express.Request, res: express.Response) {
    try {
      const { username, credential, access_token } = req.body;
      const token = jwt.sign({ username }, JWT_SECRET);
      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: "Authentication failed" });
    }
  }

  static async validateToken(req: express.Request, res: express.Response) {
    try {
      const { token } = req.body;
      const valid = jwt.verify(token, JWT_SECRET);
      res.json({ valid: !!valid });
    } catch (err) {
      res.json({ valid: false });
    }
  }

  static async getPfp(req: express.Request, res: express.Response) {
    try {
      const { username } = req.body;
      const user = await psqlClient.user.findUnique({
        where: { username }
      });
      res.json(user?.pfp || "default");
    } catch (err) {
      res.status(500).json({ message: "Failed to get profile picture" });
    }
  }

  static async getUserInfo(req: express.Request, res: express.Response) {
    try {
      const { username } = req.body;
      const user = await psqlClient.user.findUnique({
        where: { username }
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  }

  static async updateUser(req: express.Request, res: express.Response) {
    try {
      const { currentUsername, updatedUsername, about, pfp } = req.body;
      await psqlClient.user.update({
        where: { username: currentUsername },
        data: { username: updatedUsername, about, pfp }
      });
      res.json("success");
    } catch (err) {
      res.status(500).json({ message: "Failed to update user" });
    }
  }

  static async addToActiveDuoCall(req: express.Request, res: express.Response) {
    try {
      const { username, socketId } = req.body;
      await psqlClient.activeDuoCall.create({
        data: { username, socketId }
      });
      res.json("success");
    } catch (err) {
      res.status(500).json({ message: "Failed to add to active duo call" });
    }
  }

  static async deleteFromActiveDuoCall(req: express.Request, res: express.Response) {
    try {
      const { username } = req.body;
      await psqlClient.activeDuoCall.delete({
        where: { username }
      });
      res.json("success");
    } catch (err) {
      res.status(500).json({ message: "Failed to delete from active duo call" });
    }
  }

  static async getActiveDuoCall(req: express.Request, res: express.Response) {
    try {
      const { friendName, socketId } = req.body;
      const duoCall = await psqlClient.activeDuoCall.findFirst({
        where: { username: friendName, socketId }
      });
      res.json(duoCall ? "success" : "not found");
    } catch (err) {
      res.status(500).json({ message: "Failed to get active duo call" });
    }
  }

  static async getMatches(req: express.Request, res: express.Response) {
    try {
      const matches = await psqlClient.match.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(matches);
    } catch (err) {
      res.status(500).json({ message: "Failed to get matches" });
    }
  }

  static async getUsers(req: express.Request, res: express.Response) {
    try {
      const users = await psqlClient.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          coins: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to get users" });
    }
  }

  static async deleteUser(req: express.Request, res: express.Response) {
    try {
      const userId = parseInt(req.params.id);
      await psqlClient.user.delete({
        where: { id: userId }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }

  static async banUser(req: express.Request, res: express.Response) {
    try {
      const userId = parseInt(req.params.id);
      await psqlClient.activeUser.deleteMany({
        where: { user: { id: userId } }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  }

  static async recordMatch(req: express.Request, res: express.Response) {
    try {
      const { userId, matchedWith, isFake } = req.body;
      const match = await psqlClient.match.create({
        data: { userId, matchedWith, isFake }
      });
      res.json(match);
    } catch (err) {
      res.status(500).json({ message: "Failed to record match" });
    }
  }
}

export default ApiService;