import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userController from "../../../../src/controllers/user.controller.js";
import User from "../../../../src/models/user.model.js";
import jwt from "jsonwebtoken";

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

describe("User Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // Test getUsers
  describe("getUsers", () => {
    it("should return a list of users with status 200", async () => {
      // Mocking database response
      const mockUsers = [{ id: 1, name: "John Doe" }];
      vi.spyOn(User, "findAll").mockResolvedValue(mockUsers);

      // Mocking request and response objects
      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should return 500 if an error occurs in getUsers", async () => {
      // Mocking database failure
      vi.spyOn(User, "findAll").mockRejectedValueOnce(
        new Error("Database error")
      );

      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
  // Test singUp
  describe("signUp", () => {
    it("should return 400 if username exists", async () => {
      const req = {
        body: {
          username: "existingUser",
          password: "password123",
          email: "test@example.com",
          authority: "USER",
        },
      };
      const res = createRes();

      // Set the mock for findAll
      vi.spyOn(User, "findAll").mockResolvedValue([
        { username: "existingUser" },
      ]);

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username already exists",
      });
    });

    it("should create user successfully in signUp", async () => {
      const req = {
        body: {
          username: "existingUser",
          password: "password123",
          email: "test@example.com",
          authority: "USER",
        },
      };
      const res = createRes();

      vi.spyOn(User, "findAll").mockResolvedValue([]);
      vi.spyOn(User, "create").mockResolvedValue({});

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User existingUser created successfully with authority USER",
      });
    });
  });

  // Test singIn
  describe("signIn", () => {
    it("should return 404 if user not found in signIn", async () => {
      const req = {
        body: {
          username: "nonExistentUser",
          password: "password123",
        },
      };
      const res = createRes();

      // simulate no user found
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 401 if password is invalid in signIn", async () => {
      const req = {
        body: {
          username: "existingUser",
          password: "wrongPassword",
        },
      };
      const res = createRes();
      const mockUser = { username: "existingUser", password: "hashedPassword" };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid password" });
    });
  });

  // Test signOut
  describe("signOut", () => {
    it("should return 204 if no refreshToken in signOut", async () => {
      const req = {
        refreshToken: null,
      };
      const res = createRes();

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        message: "No refresh token provided",
      });
    });

    it("should successfully sign out in signOut", async () => {
      const res = createRes();
      const req = {
        cookies: { refreshToken: "validToken" }, // FIX: Token must be in req.cookies
      };
      const user = [
        { id: 1, username: "existingUser", refresh_token: "validToken" },
      ];

      vi.spyOn(User, "findAll").mockResolvedValue(user);
      vi.spyOn(User, "update").mockResolvedValue([1]);

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        message: "Signed out successfully",
      });
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object)
      ); // FIX: Verify that the cookie is cleared
    });
  });

  // Test para deleteUserById
  describe("deleteUserById", () => {
    it("should return 404 if user not found in deleteUserById", async () => {
      vi.spyOn(User, "findByPk").mockResolvedValue(null);
      const res = createRes();
      const req = { params: { id: 1 } };
      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should delete user successfully in deleteUserById", async () => {
      const res = createRes();
      const user = {
        id: 1,
        username: "existingUser",
        destroy: vi.fn().mockResolvedValue({}), // destroy() is a real function that returns a resolved promise.
      };
      vi.spyOn(User, "findByPk").mockResolvedValue(user);
      vi.spyOn(user, "destroy").mockResolvedValue({});

      const req = { params: { id: 1 } };

      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });
  });

  // Test getAuthority
  describe("getAuthority", () => {
    it("should return authority if valid token is provided", async () => {
      const mockAuthority = "admin";
      const mockToken = "validToken";

      vi.spyOn(jwt, "verify").mockReturnValue({ authority: mockAuthority });

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: mockAuthority });
    });

    it("should return 401 if no token is provided", async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "No token provided or it's malformed",
      });
    });

    it("should return 403 if the token is invalid", async () => {
      const req = { cookies: { accessToken: "invalidToken" } };
      const res = createRes();

      vi.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error();
      });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    });
  });
});
