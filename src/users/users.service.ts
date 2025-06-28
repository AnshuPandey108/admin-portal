import { BadRequestException, ConflictException, Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Otp } from '../auth/entities/otp.entity';
import { MailService } from '../mail/mail.service';
import { In } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Otp)
        private readonly otpRepo: Repository<Otp>,

        private readonly mailService: MailService,
    ) { }

    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepo.create(data);
        return await this.userRepo.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepo.findOne({ where: { email } });
    }

    async createUserAndSendOtp(
        email: string,
        roleToAssign: UserRole,
        groupIdFromBody: string | undefined,
        creator: { email: string; role: UserRole; groupId?: string },
    ): Promise<{ message: string }> {
        // 1) No duplicates
        if (await this.userRepo.findOne({ where: { email } })) {
            throw new ConflictException('User already exists');
        }

        // 2) Decide groupId and allowed roles
        let assignedGroupId: any;
        if (creator.role === UserRole.SUPER_ADMIN) {
            // SuperAdmin can create ANY role, but must pass groupId
            if (roleToAssign === UserRole.SUPPORT) {
                assignedGroupId = null;
            }
            else {
                if (!groupIdFromBody) {
                    throw new BadRequestException('Group ID is required for Super Admin');
                }
                assignedGroupId = groupIdFromBody;
            }
        } else if (creator.role === UserRole.ADMIN) {
            // Admin can only create USERS or POWER_USERs in their own group
            if (![UserRole.USER, UserRole.POWER_USER].includes(roleToAssign)) {
                throw new UnauthorizedException(
                    'Admin may only create Users or Power Users',
                );
            }
            if (!creator.groupId) {
                throw new UnauthorizedException('Your account has no group assigned');
            }
            assignedGroupId = creator.groupId;
        } else {
            throw new UnauthorizedException(
                'Only Super Admin or Admin may create users',
            );
        }

        // 3) Create skeleton user (empty password + unverified)
        const user = this.userRepo.create({
            email,
            password: '',
            role: roleToAssign,
            groupId: assignedGroupId,
            isOtpVerified: false,
        });
        await this.userRepo.save(user);

        // 4) Generate & store OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10m TTL
        await this.otpRepo.save({ email, code, expiresAt });

        // 5) Send onboarding link
        const otpLink = `http://127.0.0.1:5500/otp-flow.html?email=${email}&code=${code}`;
        await this.mailService.sendOtpLink(
            creator.email, // who invited
            email,         // who’s being invited
            otpLink,
        );

        return { message: `OTP link sent to ${email}` };
    }

    async getVisibleUsers(user: User): Promise<User[]> {
        if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUPPORT) {
            return this.userRepo.find({
                relations: ['group'],
            });
        }

        if (user.role === UserRole.ADMIN) {
            return this.userRepo.find({
                where: {
                    groupId: user.groupId,
                    role: In([UserRole.POWER_USER, UserRole.USER]),
                },
                relations: ['group'], // JOIN with group
            });
        }

        if (user.role === UserRole.POWER_USER) {
            return this.userRepo.find({
                where: {
                    groupId: user.groupId,
                    role: UserRole.USER,
                },
                relations: ['group'], // JOIN with group
            });
        }

        throw new ForbiddenException('Not authorized to view users');
    }


    async deleteUserByRoleAware(id: string, requester: User): Promise<{ message: string }> {
        const targetUser = await this.userRepo.findOne({ where: { id } });

        if (!targetUser) throw new NotFoundException('User not found');

        // Super Admin: can delete anyone
        if (requester.role === UserRole.SUPER_ADMIN) {
            await this.userRepo.delete(id);
            return { message: 'User deleted' };
        }

        // Admin: can delete user/power_user in same group
        if (
            requester.role === UserRole.ADMIN &&
            [UserRole.USER, UserRole.POWER_USER].includes(targetUser.role) &&
            targetUser.groupId === requester.groupId
        ) {
            await this.userRepo.delete(id);
            return { message: 'User deleted by Admin' };
        }

        throw new ForbiddenException('You are not allowed to delete this user');
    }


    async getOneVisibleUser(id: string, currentUser: User): Promise<User> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['group'], // optional, only if you want group data
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 🔐 Access Control
        if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUPPORT) {
            return user;
        }

        if (
            currentUser.role === UserRole.ADMIN &&
            user.groupId === currentUser.groupId &&
            [UserRole.POWER_USER, UserRole.USER].includes(user.role)
        ) {
            return user;
        }

        if (
            currentUser.role === UserRole.POWER_USER &&
            user.groupId === currentUser.groupId &&
            user.role === UserRole.USER
        ) {
            return user;
        }

        throw new ForbiddenException('Not allowed to view this user');
    }


}
