import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private servicesService: ServicesService,
  ) {}

  async create(
    clientId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const service = await this.servicesService.findByInviteCode(
      createBookingDto.inviteCode,
    );

    const appointmentTime = new Date(createBookingDto.appointmentTime);

    if (appointmentTime < new Date()) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    const conflictingBooking = await this.checkForConflict(
      service.id,
      appointmentTime,
      service.duration,
    );

    if (conflictingBooking) {
      throw new ConflictException(
        'This time slot is already booked. Please choose another time.',
      );
    }

    const booking = this.bookingsRepository.create({
      serviceId: service.id,
      clientId,
      appointmentTime,
      notes: createBookingDto.notes,
      status: BookingStatus.PENDING,
    });

    return this.bookingsRepository.save(booking);
  }

  async findMyBookings(clientId: string): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { clientId },
      relations: ['service', 'service.provider'],
      order: { appointmentTime: 'DESC' },
    });
  }

  async findProviderBookings(providerId: string): Promise<Booking[]> {
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.client', 'client')
      .where('service.providerId = :providerId', { providerId })
      .orderBy('booking.appointmentTime', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['service', 'service.provider', 'client'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    providerId: string,
    updateStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.service.providerId !== providerId) {
      throw new ForbiddenException(
        'You can only update bookings for your own services',
      );
    }

    booking.status = updateStatusDto.status;
    return this.bookingsRepository.save(booking);
  }

  async cancelBooking(id: string, userId: string, role: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (role === 'client' && booking.clientId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (role === 'provider' && booking.service.providerId !== userId) {
      throw new ForbiddenException(
        'You can only cancel bookings for your own services',
      );
    }

    if (booking.appointmentTime < new Date()) {
      throw new BadRequestException('Cannot cancel past appointments');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  async deleteBooking(id: string, userId: string, role: string): Promise<void> {
    const booking = await this.findOne(id);

    if (role === 'client' && booking.clientId !== userId) {
      throw new ForbiddenException('You can only delete your own bookings');
    }

    if (role === 'provider') {
      throw new ForbiddenException(
        'Providers cannot delete bookings. Use cancel instead.',
      );
    }

    await this.bookingsRepository.remove(booking);
  }

  private async checkForConflict(
    serviceId: string,
    appointmentTime: Date,
    duration: number,
  ): Promise<Booking | null> {
    const startTime = appointmentTime;
    const endTime = new Date(appointmentTime.getTime() + duration * 60000);

    const conflictingBooking = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.serviceId = :serviceId', { serviceId })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .andWhere(
        '(booking.appointmentTime < :endTime AND DATE_ADD(booking.appointmentTime, INTERVAL (SELECT duration FROM services WHERE id = :serviceId) MINUTE) > :startTime)',
        { startTime, endTime, serviceId },
      )
      .getOne();

    return conflictingBooking;
  }
}