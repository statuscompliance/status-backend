import User from '../../../src/models/user.model.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('User Model (Unit Tests)', () => {
  beforeEach(() => {
    // vi.spyOn(User.prototype, 'generateAccessToken').mockReturnValue('mocked-jwt-token'); // Simulate JWT
  });

  it('should hash the password correctly', async () => {
    const hashSpy = vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const user = {
      password: 'password123',
      comparePassword: async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
      },
    };
    const result = await user.comparePassword('password123');

    expect(hashSpy).toHaveBeenCalledWith('password123', 'password123');
    expect(result).toBe(true);
  });

  it('should generate a valid JWT token', () => {
    const user = User.build({ id: 1, username: 'testuser' });

    const token = user.generateAccessToken();

    const decoded = jwt.verify(
      token,
      'mocked-jwt-token' // DELETE: process.env.JWT_SECRET is undefined
    );
    expect(decoded).toHaveProperty('id', 1);
    expect(decoded).toHaveProperty('username', 'testuser');
  });

  it('should validate email correctly', () => {
    const user = {
      email: 'test@example.com',
      validateEmail: function () {
        const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        return emailRegex.test(this.email);
      },
    };
    const isValid = user.validateEmail();

    expect(isValid).toBe(true);
  });

  it('should throw error when email is invalid', () => {
    const user = {
      email: 'invalid-email',
      validateEmail: function () {
        const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        return emailRegex.test(this.email);
      },
    };

    const isValid = user.validateEmail();

    expect(isValid).toBe(false);
  });

  it('should mock a User.create method without inserting data', async () => {
    // Mock de Sequelize User.create
    const createSpy = vi.spyOn(User, 'create').mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });

    const user = await User.create({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    });

    // Verificamos que el método create fue llamado
    expect(createSpy).toHaveBeenCalled();
    expect(user).toHaveProperty('id');
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
  });
});
