import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { InMemoryStore } from '../in-memory-store';

@Injectable()
export class UsersService {
  constructor(private readonly store: InMemoryStore) {}


  create(dto: CreateUserDto) {
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
    if (
      this.store.users.some(
        (user) => user.username === dto.username || user.email === dto.email,
      )
    ) {
      throw new BadRequestException('Username or email is already in use');
    }

    const user = this.store.createUser(dto);
    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    };
  }
}
