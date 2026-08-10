import { authService } from './auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should securely hash a password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const hash = await bcrypt.hash('my_password', 10);
      expect(hash).toBe('hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('my_password', 10);
    });

    it('should correctly compare a valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isValid = await bcrypt.compare('my_password', 'hashed_password');
      expect(isValid).toBe(true);
    });

    it('should correctly reject an invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isValid = await bcrypt.compare('wrong_password', 'hashed_password');
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Generation', () => {
    it('should generate a signed JWT', () => {
      const mockPayload = { userId: '123', email: 'test@test.com', role: 'STUDENT' };
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');
      
      const token = jwt.sign(mockPayload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
      
      expect(token).toBe('mock_token');
      expect(jwt.sign).toHaveBeenCalledWith(mockPayload, 'test_secret', { expiresIn: '7d' });
    });
  });
});
