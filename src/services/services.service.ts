import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import * as crypto from 'crypto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(
    providerId: string,
    createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    const inviteCode = this.generateInviteCode();

    const service = this.servicesRepository.create({
      ...createServiceDto,
      providerId,
      inviteCode,
    });

    return this.servicesRepository.save(service);
  }

  async findAll(): Promise<Service[]> {
    return this.servicesRepository.find({
      relations: ['provider'],
    });
  }

  async findMyServices(providerId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { providerId },
      relations: ['provider', 'bookings'],
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['provider', 'bookings'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findByInviteCode(inviteCode: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { inviteCode },
      relations: ['provider'],
    });

    if (!service) {
      throw new NotFoundException('Service not found with this invite code');
    }

    return service;
  }

  async update(
    id: string,
    providerId: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findOne(id);

    if (service.providerId !== providerId) {
      throw new ForbiddenException('You can only update your own services');
    }

    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async delete(id: string, providerId: string): Promise<void> {
    const service = await this.findOne(id);

    if (service.providerId !== providerId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    await this.servicesRepository.remove(service);
  }

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}