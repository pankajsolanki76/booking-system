-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED');

-- CreateTable
CREATE TABLE "ScreenSeat" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "rowLabel" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreenSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowSeat" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "screenSeatId" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lockedAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScreenSeat_screenId_idx" ON "ScreenSeat"("screenId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreenSeat_screenId_seatNumber_key" ON "ScreenSeat"("screenId", "seatNumber");

-- CreateIndex
CREATE INDEX "ShowSeat_showId_idx" ON "ShowSeat"("showId");

-- CreateIndex
CREATE INDEX "ShowSeat_status_idx" ON "ShowSeat"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShowSeat_showId_screenSeatId_key" ON "ShowSeat"("showId", "screenSeatId");

-- AddForeignKey
ALTER TABLE "ScreenSeat" ADD CONSTRAINT "ScreenSeat_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowSeat" ADD CONSTRAINT "ShowSeat_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowSeat" ADD CONSTRAINT "ShowSeat_screenSeatId_fkey" FOREIGN KEY ("screenSeatId") REFERENCES "ScreenSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
