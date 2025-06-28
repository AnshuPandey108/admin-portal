import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

   TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
 useFactory: (config: ConfigService) => {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST'),
    port: parseInt(config.get<string>('DB_PORT') ?? '5432'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  };
}

}),

   UsersModule,
   AuthModule,
   GroupsModule,
   MailModule,
   TransactionsModule

    // We'll build this module next
  ],
  controllers: [AppController], // 👈 Add this
  providers: [AppService, MailService],     // 👈 Add this
})
export class AppModule {}
