import express from "express";
import ApiService from "../services/apiService";

const router = express.Router();

router.post("/api/auth", ApiService.auth);
router.post("/api/validateToken", ApiService.validateToken);
router.post("/api/getPfp", ApiService.getPfp);
router.post("/api/getUserInfo", ApiService.getUserInfo);
router.post("/api/updateUser", ApiService.updateUser);
router.post("/api/addToActiveDuoCall", ApiService.addToActiveDuoCall);
router.post("/api/deleteFromActiveDuoCall", ApiService.deleteFromActiveDuoCall);
router.post("/api/getActiveDuoCall", ApiService.getActiveDuoCall);

// Admin endpoints
router.get("/api/matches", ApiService.getMatches);
router.get("/api/users", ApiService.getUsers);
router.delete("/api/users/:id", ApiService.deleteUser);
router.post("/api/users/:id/ban", ApiService.banUser);
router.post("/api/recordMatch", ApiService.recordMatch);

export default router;