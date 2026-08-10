import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

jest.mock('@vladmandic/face-api', () => ({}));
jest.mock('@tensorflow/tfjs', () => ({}));

describe('API Routing & RBAC Security', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should reject unauthenticated requests to protected routes', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject requests with invalid JWT tokens', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_token_xyz');
    
    expect(res.status).toBe(401);
  });

  it('should deny a STUDENT access to ADMIN routes', async () => {
    const studentToken = jwt.sign(
      { userId: 'stu_123', email: 'stu@test.com', role: 'STUDENT', status: 'ACTIVE' },
      process.env.JWT_SECRET as string
    );

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    
    // requireRole('ADMIN') should intercept and return 403 Forbidden
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should deny a FACULTY access to ADMIN routes', async () => {
    const facultyToken = jwt.sign(
      { userId: 'fac_123', email: 'fac@test.com', role: 'FACULTY', status: 'ACTIVE' },
      process.env.JWT_SECRET as string
    );

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${facultyToken}`);
    
    expect(res.status).toBe(403);
  });
});
