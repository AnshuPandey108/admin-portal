import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Otp } from '../auth/entities/otp.entity'; // ✅ Import Otp entity
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]), // ✅ Register both User and Otp
    MailModule, // ✅ For injecting MailService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Optional, if other modules use it
})
export class UsersModule {}
