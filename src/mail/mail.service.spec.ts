import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;

  const mockSendMail = jest.fn();

  beforeEach(async () => {
    // Mock nodemailer.createTransport to return object with sendMail
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'MAIL_USER':
            return 'testuser@gmail.com';
          case 'MAIL_PASSWORD':
            return 'testpass';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send OTP link email', async () => {
    mockSendMail.mockResolvedValueOnce(true);

    const from = 'noreply@admin.com';
    const to = 'user@example.com';
    const otpLink = 'https://example.com/set-password?token=abc123';

    await service.sendOtpLink(from, to, otpLink);

    expect(mockSendMail).toHaveBeenCalledWith({
      from,
      to,
      subject: 'Set your password',
      html: expect.stringContaining(otpLink),
    });
  });
});
