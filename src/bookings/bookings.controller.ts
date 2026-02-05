import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { GetUser } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new booking (Client only)' })
  create(@Body() createBookingDto: CreateBookingDto, @GetUser() user: any) {
    return this.bookingsService.create(user.userId, createBookingDto);
  }

  @Get('mine')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get my bookings (Client only)' })
  findMyBookings(@GetUser() user: any) {
    return this.bookingsService.findMyBookings(user.userId);
  }

  @Get('provider')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Get all bookings for my services (Provider only)' })
  findProviderBookings(@GetUser() user: any) {
    return this.bookingsService.findProviderBookings(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Update booking status (Provider only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @GetUser() user: any,
  ) {
    return this.bookingsService.updateStatus(
      id,
      user.userId,
      updateStatusDto,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (Client or Provider)' })
  cancelBooking(@Param('id') id: string, @GetUser() user: any) {
    return this.bookingsService.cancelBooking(id, user.userId, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Delete a booking (Client only)' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.bookingsService.deleteBooking(id, user.userId, user.role);
  }
}