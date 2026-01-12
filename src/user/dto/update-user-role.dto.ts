import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";

export class UpdateUserRoleDto {
    
    @ApiPropertyOptional({default:UserRole.ADMIN,enum:UserRole})
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.ADMIN
}