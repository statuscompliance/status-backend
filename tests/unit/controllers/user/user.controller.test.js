import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userController from "../../../../src/controllers/user.controller.js";
import User from "../../../../src/models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn()
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

    it("should handle errors gracefully in getUsers", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(User, "findAll").mockRejectedValueOnce(
        new Error("Database error")
      );

      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(consoleSpy).toHaveBeenCalled(); // Verify that the error has been registered
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });

      consoleSpy.mockRestore(); // Clear the console.error mock
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
    it("should return 400 if username exists (case insensitive)", async () => {
      const req = {
        body: {
          username: "ExistingUser", // Variación en el caso
          password: "password123",
          email: "test@example.com",
          authority: "USER",
        },
      };
      const res = createRes();
    
      // Set the mock for findAll with case-insensitive search
      vi.spyOn(User, "findAll").mockResolvedValue([
        { username: "existinguser" }, // Nombre en minúsculas
      ]);
    
      await userController.signUp(req, res);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username already exists",
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
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword"
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid password" });
    });

    it("should return 200 and a token if signIn is successful", async () => {
      const req = {
        body: {
          username: "existingUser",
          password: "correctPassword",
        },
      };
      const res = createRes();
      const mockUser = {
        username: "existingUser",
        password: "hashedPassword",
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true);
      vi.spyOn(jwt, "sign").mockReturnValue("mockToken");
      vi.spyOn(User, "update").mockResolvedValue([1]);

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctPassword",
        "hashedPassword"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "mockToken",
          refreshToken: "mockToken",
          username: "existingUser",
        })
      );
      expect(User.update).toHaveBeenCalledWith(
        { refresh_token: "mockToken" },
        { where: { username: "existingUser" } }
      );
    });

    it("should return 400 if username is missing", async () => {
      const req = { body: { password: "somePassword" } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username and password are required",
      });
    });

    it("should return 400 if password is missing", async () => {
      const req = { body: { username: "existingUser" } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username and password are required",
      });
    });
    it("should return 400 if username is missing", async () => {
      const req = { body: { password: "somePassword" } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username and password are required",
      });
    });

    it("should return 400 if password is missing", async () => {
      const req = { body: { username: "existingUser" } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username and password are required",
      });
    });

    it("should handle special characters in username", async () => {
      const req = {
        body: { username: "user!@#", password: "correctPassword" },
      };
      const res = createRes();

      // Mock de usuario
      const mockUser = {
        username: "user!@#",
        password: "hashedPassword",
        email: "user@example.com",
        authority: "userAuthority",
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true);
      vi.spyOn(jwt, "sign").mockImplementation(() => "mockToken");

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctPassword",
        "hashedPassword"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "mockToken",
          refreshToken: "mockToken",
          username: "user!@#",
          email: "user@example.com",
          authority: "userAuthority",
          nodeRedToken: "",
        })
      );
    });
  });

  // Test signOut
  describe("signOut", () => {
    it("should return 400 if no refreshToken in signOut", async () => {
      const req = {
        refreshToken: null,
      };
      const res = createRes();

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No refresh token provided",
      });
    });

    it("should sign out successfully", async () => {
      const res = createRes();
      // FIX: Token must be in req.cookies
      const req = {
        cookies: { refreshToken: "validToken" }, 
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
       // FIX: Verify that the cookie is cleared
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object)
      );
    });

    it("should return 404 if user not found for refreshToken", async () => {
      // Mock invalid token
      const req = {
        cookies: { refreshToken: "invalidToken" } 
      };
      const res = createRes();
      
      // Mocking the user not found scenario
      vi.spyOn(User, "findAll").mockResolvedValue([]); // No user with that refresh token
  
      await userController.signOut(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No user found for provided refresh token",
      });
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object));
    });
    
  });

  // Test para deleteUserById
  describe("deleteUserById", () => {
    it("should return 404 if user not found in deleteUserById", async () => {
      
      const res = createRes();
      const req = { params: { id: 1 } };

      vi.spyOn(User, "findByPk").mockResolvedValue(null);

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

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      vi.spyOn(jwt, "verify").mockReturnValue({ authority: mockAuthority });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: mockAuthority });
    });

    it("should return 400 if no token is provided", async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token is required'  });
    });

    it("should return 401 if the token has expired", async () => {
      const expiredToken = "expiredToken";
      const req = { cookies: { accessToken: expiredToken } };
      const res = createRes();
    
      // Mocking jwt.verify to simulate expired token error
      vi.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });
    
      await userController.getAuthority(req, res);
    
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
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

    it('should return 400 if token is missing or empty', async () => {
      const req = { cookies: { accessToken: "" } };
      const res = createRes();
      const next = vi.fn();
  
      await userController.getAuthority(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Token is required" });
      expect(next).not.toHaveBeenCalled();
    });
  });

});
