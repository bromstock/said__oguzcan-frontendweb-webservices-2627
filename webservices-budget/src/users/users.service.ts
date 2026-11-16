import { BadRequestException, Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { CreateUserDto } from './create-user.dto';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async create(dto: CreateUserDto) {
    if (
      !dto ||
      typeof dto.username !== 'string' ||
      dto.username.trim().length === 0 ||
      typeof dto.email !== 'string' ||
      dto.email.trim().length === 0 ||
      typeof dto.password_hash !== 'string' ||
      dto.password_hash.length === 0
    ) {
      throw new BadRequestException(
        'Username, email, and password_hash are required',
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('A valid email address is required');
    }
    const [existingUser] = await this.database.db
      .select({ user_id: users.user_id })
      .from(users)
      .where(or(eq(users.username, dto.username), eq(users.email, dto.email)));
    if (existingUser) {
      throw new BadRequestException('Username or email is already in use');
    }

    const [inserted] = await this.database.db
      .insert(users)
      .values(dto)
      .$returningId();
    const [user] = await this.database.db
      .select({
        user_id: users.user_id,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(eq(users.user_id, inserted.user_id));
    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    };
  }
}
