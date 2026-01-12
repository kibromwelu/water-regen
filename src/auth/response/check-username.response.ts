import { ApiProperty } from "@nestjs/swagger";

export class CheckUsernameResponse {
    @ApiProperty()
    available: boolean;
}
