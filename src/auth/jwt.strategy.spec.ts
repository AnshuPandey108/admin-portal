import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  beforeEach(() => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    jwtStrategy = new JwtStrategy(mockConfigService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('should validate JWT payload correctly', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      groupId: 'group-xyz',
    };

    const result = jwtStrategy.validate(payload);
    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      groupId: 'group-xyz',
    });
  });
});
