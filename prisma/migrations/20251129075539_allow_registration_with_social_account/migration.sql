-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registeredBySocialType" "SocialAccountProvider",
ALTER COLUMN "phoneNumber" DROP NOT NULL;
