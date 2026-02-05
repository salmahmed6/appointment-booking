import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serviceId: string;

  @Column()
  clientId: string;

  @Column({ type: 'timestamp' })
  appointmentTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}