import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@msbdocs.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@msbdocs.com",
      passwordHash: adminPassword,
      role: "admin",
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);

  // Create sample visitors
  const visitors = [
    {
      title: "Mr",
      firstName: "Rahul",
      middleName: "Kumar",
      lastName: "Sharma",
      gender: "Male",
      email: "rahul.sharma@example.com",
      mobile: "9876543210",
      streetAddress: "123 MG Road",
      addressLine2: "Suite 4A",
    },
    {
      title: "Ms",
      firstName: "Priya",
      middleName: null,
      lastName: "Patel",
      gender: "Female",
      email: "priya.patel@example.com",
      mobile: "9876543211",
      streetAddress: "456 Brigade Road",
      addressLine2: null,
    },
    {
      title: "Mr",
      firstName: "Amit",
      middleName: null,
      lastName: "Singh",
      gender: "Male",
      email: "amit.singh@example.com",
      mobile: "9876543212",
      streetAddress: "789 Indiranagar",
      addressLine2: "Building B",
    },
    {
      title: "Dr",
      firstName: "Sneha",
      middleName: "R",
      lastName: "Reddy",
      gender: "Female",
      email: "sneha.reddy@example.com",
      mobile: "9876543213",
      streetAddress: "321 Koramangala",
      addressLine2: null,
    },
    {
      title: "Mr",
      firstName: "Vikram",
      middleName: null,
      lastName: "Desai",
      gender: "Male",
      email: "vikram.desai@example.com",
      mobile: "9876543214",
      streetAddress: "654 Whitefield",
      addressLine2: "Floor 3",
    },
  ];

  for (const visitorData of visitors) {
    const visitor = await prisma.visitorProfile.upsert({
      where: { email: visitorData.email },
      update: {},
      create: visitorData,
    });

    // Create visit records for each visitor
    const purposes = ["Business Meeting", "Interview", "Delivery", "Consultation", "Maintenance"];
    const companies = ["TechCorp India", "Infosys", "Wipro", "TCS", "HCL Technologies"];
    const persons = ["Rajesh Kumar", "Anita Gupta", "Suresh Menon", "Kavita Nair", "Prakash Joshi"];

    const numVisits = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numVisits; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const entryTime = new Date();
      entryTime.setDate(entryTime.getDate() - daysAgo);
      entryTime.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60));

      const statuses = ["checked-in", "checked-out", "pending"];
      const status = i === 0 ? statuses[Math.floor(Math.random() * 3)] : "checked-out";

      const checkInTime = status !== "pending" ? new Date(entryTime.getTime() + 5 * 60000) : null;
      const checkOutTime = status === "checked-out" ? new Date(entryTime.getTime() + 2 * 3600000) : null;

      await prisma.visitRecord.create({
        data: {
          visitorProfileId: visitor.id,
          purposeOfVisit: purposes[Math.floor(Math.random() * purposes.length)],
          companyToVisit: companies[Math.floor(Math.random() * companies.length)],
          personToVisit: persons[Math.floor(Math.random() * persons.length)],
          visitorTagNumber: `VT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          idProofType: ["Aadhar Card", "PAN Card", "Driving License"][Math.floor(Math.random() * 3)],
          idProofNumber: `XXXX${Math.floor(Math.random() * 9000) + 1000}`,
          carryingPersonalGadget: Math.random() > 0.5,
          gadgetType: Math.random() > 0.5 ? "Laptop" : null,
          gadgetBrandModel: Math.random() > 0.5 ? "Dell Latitude 5520" : null,
          gadgetIdentifier: Math.random() > 0.5 ? `SN-${Math.floor(Math.random() * 900000) + 100000}` : null,
          entryTime,
          checkInTime,
          checkOutTime,
          status,
        },
      });
    }

    console.log(`✅ Visitor created: ${visitor.firstName} ${visitor.lastName} with ${numVisits} visit(s)`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("  Admin: admin@msbdocs.com / admin123");
  console.log("  Sample visitor emails: rahul.sharma@example.com, priya.patel@example.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
