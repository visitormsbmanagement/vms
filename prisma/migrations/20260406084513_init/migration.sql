-- CreateTable
CREATE TABLE "VisitorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "streetAddress" TEXT,
    "addressLine2" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "VisitRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorProfileId" TEXT NOT NULL,
    "purposeOfVisit" TEXT NOT NULL,
    "companyToVisit" TEXT NOT NULL,
    "personToVisit" TEXT NOT NULL,
    "visitorTagNumber" TEXT,
    "idProofType" TEXT,
    "idProofNumber" TEXT,
    "carryingPersonalGadget" BOOLEAN NOT NULL DEFAULT false,
    "gadgetType" TEXT,
    "gadgetBrandModel" TEXT,
    "gadgetIdentifier" TEXT,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" DATETIME,
    "checkOutTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitRecord_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "VisitorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorProfileId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpCode_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "VisitorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitorProfile_email_key" ON "VisitorProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
