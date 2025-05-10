import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/environment";
import { psqlClient } from "../config/database";
import axios from "axios";

class ApiService {
  // ... (mevcut metodlar aynı kalacak)

  static async getUsers(req: express.Request, res: express.Response) {
    try {
      const users = await psqlClient.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
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
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Error deleting user" });
    }
  }

  static async banUser(req: express.Request, res: express.Response) {
    try {
      const userId = parseInt(req.params.id);
      // Kullanıcıyı banla ve aktif oturumlarını sonlandır
      await psqlClient.activeUser.deleteMany({
        where: { user: { id: userId } }
      });
      // Burada ek ban işlemleri eklenebilir
      res.json({ success: true });
    } catch (err) {
      console.error("Error banning user:", err);
      res.status(500).json({ message: "Error banning user" });
    }
  }

  // ... (diğer mevcut metodlar aynı kalacak)
}

export default ApiService;