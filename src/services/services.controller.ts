import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { GetUser } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Create a new service (Provider only)' })
  create(@Body() createServiceDto: CreateServiceDto, @GetUser() user: any) {
    return this.servicesService.create(user.userId, createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('mine')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Get my services (Provider only)' })
  findMyServices(@GetUser() user: any) {
    return this.servicesService.findMyServices(user.userId);
  }

  @Get('by-invite')
  @ApiOperation({ summary: 'Find service by invite code' })
  @ApiQuery({ name: 'code', example: 'ABC123' })
  findByInviteCode(@Query('code') code: string) {
    return this.servicesService.findByInviteCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Update service (Provider only)' })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser() user: any,
  ) {
    return this.servicesService.update(id, user.userId, updateServiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Delete service (Provider only)' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.servicesService.delete(id, user.userId);
  }
}