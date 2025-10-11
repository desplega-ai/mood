-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('daily', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "recurrence" "Recurrence" NOT NULL DEFAULT 'daily';

-- AlterTable
ALTER TABLE "mood_entries" DROP COLUMN "mood",
DROP COLUMN "timeOfDay",
ADD COLUMN     "moodToday" INTEGER,
ADD COLUMN     "moodYesterday" INTEGER;
