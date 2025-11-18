import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";


export class GetUserRoleResponse {
    @ApiProperty({enum: UserRole})
    role: UserRole;
}