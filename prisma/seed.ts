import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create mock sellers
  const passwordHash = await bcrypt.hash('password123', 10)

  const seller1 = await prisma.user.create({
    data: {
      name: 'Maria Garcia',
      email: 'maria@example.com',
      passwordHash,
      sellerProfile: {
        create: {
          bio: 'Born and raised in Santa Fe. I make traditional New Mexican dishes using recipes passed down from my abuelita.',
          city: 'Santa Fe',
          state: 'NM',
          zipCode: '87505',
          phone: '(505) 555-0101',
          contactEmail: 'maria.homecook@email.com',
        },
      },
    },
  })

  const seller2 = await prisma.user.create({
    data: {
      name: 'James Whitehorse',
      email: 'james@example.com',
      passwordHash,
      sellerProfile: {
        create: {
          bio: 'Former restaurant chef now cooking from home. Specializing in smoked meats and green chile everything.',
          city: 'Santa Fe',
          state: 'NM',
          zipCode: '87505',
          phone: '(505) 555-0202',
          contactEmail: 'james.cooks@email.com',
        },
      },
    },
  })

  const seller3 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@example.com',
      passwordHash,
      sellerProfile: {
        create: {
          bio: 'Bringing authentic Indian flavors to Santa Fe. Everything made fresh with locally sourced ingredients when possible.',
          city: 'Santa Fe',
          state: 'NM',
          zipCode: '87505',
          phone: '(505) 555-0303',
        },
      },
    },
  })

  const seller4 = await prisma.user.create({
    data: {
      name: 'Rosa Montoya',
      email: 'rosa@example.com',
      passwordHash,
      sellerProfile: {
        create: {
          bio: 'Tamale queen of Santa Fe! I make fresh tamales every weekend — red chile, green chile, and sweet corn.',
          city: 'Santa Fe',
          state: 'NM',
          zipCode: '87505',
          phone: '(505) 555-0404',
          contactEmail: 'rosa.tamales@email.com',
        },
      },
    },
  })

  // Get seller profiles for listing creation
  const profiles = await prisma.sellerProfile.findMany({
    include: { user: true },
  })

  const profileMap = Object.fromEntries(
    profiles.map((p) => [p.user.email, p])
  )

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  dayAfter.setHours(11, 0, 0, 0)

  const weekend = new Date()
  weekend.setDate(weekend.getDate() + (6 - weekend.getDay()))
  weekend.setHours(9, 0, 0, 0)

  const pickupTomorrow = new Date(tomorrow)
  pickupTomorrow.setHours(17, 0, 0, 0)

  const pickupDayAfter = new Date(dayAfter)
  pickupDayAfter.setHours(12, 0, 0, 0)

  const pickupWeekend = new Date(weekend)
  pickupWeekend.setHours(14, 0, 0, 0)

  // Create listings
  await prisma.foodListing.createMany({
    data: [
      // Maria's listings
      {
        sellerId: profileMap['maria@example.com'].id,
        title: 'Green Chile Enchiladas (Dozen)',
        description: 'Handmade corn tortillas filled with cheese and smothered in roasted Hatch green chile sauce. Comes with rice and beans on the side. Perfect for family dinner!',
        price: 18.00,
        imageUrl: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800',
        listingDate: tomorrow,
        pickupTime: pickupTomorrow,
        pickupLocation: 'Near the Railyard, Santa Fe',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['maria@example.com'].id,
        title: 'Posole Rojo (Quart)',
        description: 'Traditional red posole with tender pork, hominy, and dried red chiles. Served with shredded cabbage, radish, and lime on the side.',
        price: 14.00,
        imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
        listingDate: tomorrow,
        pickupTime: pickupTomorrow,
        pickupLocation: 'Near the Railyard, Santa Fe',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['maria@example.com'].id,
        title: 'Fresh Sopapillas (Half Dozen)',
        description: 'Light, fluffy fried dough pillows served with honey. A New Mexican classic dessert or side.',
        price: 6.00,
        imageUrl: 'https://images.unsplash.com/photo-1558303289-166b1fa13987?w=800',
        listingDate: dayAfter,
        pickupTime: pickupDayAfter,
        pickupLocation: 'Near the Railyard, Santa Fe',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },

      // James's listings
      {
        sellerId: profileMap['james@example.com'].id,
        title: 'Smoked Brisket Plate',
        description: '12-hour smoked brisket with green chile mac and cheese and coleslaw. Tender, juicy, and packed with smoky flavor.',
        price: 22.00,
        imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
        listingDate: weekend,
        pickupTime: pickupWeekend,
        pickupLocation: 'Southside Santa Fe, near Cerrillos Rd',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['james@example.com'].id,
        title: 'Green Chile Cheeseburgers (2-Pack)',
        description: 'Half-pound burgers topped with roasted Hatch green chile and pepper jack. Comes with brioche buns — just heat and eat.',
        price: 16.00,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        listingDate: tomorrow,
        pickupTime: pickupTomorrow,
        pickupLocation: 'Southside Santa Fe, near Cerrillos Rd',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },

      // Priya's listings
      {
        sellerId: profileMap['priya@example.com'].id,
        title: 'Chicken Tikka Masala with Naan',
        description: 'Creamy tomato-based curry with tender marinated chicken. Comes with two pieces of fresh homemade garlic naan.',
        price: 15.00,
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
        listingDate: tomorrow,
        pickupTime: pickupTomorrow,
        pickupLocation: 'Downtown Santa Fe, near the Plaza',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['priya@example.com'].id,
        title: 'Vegetable Samosas (6 pieces)',
        description: 'Crispy pastry filled with spiced potatoes and peas. Served with tamarind and mint chutneys.',
        price: 10.00,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
        listingDate: dayAfter,
        pickupTime: pickupDayAfter,
        pickupLocation: 'Downtown Santa Fe, near the Plaza',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['priya@example.com'].id,
        title: 'Mango Lassi (Large)',
        description: 'Refreshing yogurt-based mango drink. Sweet, creamy, and perfect with any meal.',
        price: 5.00,
        imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800',
        listingDate: tomorrow,
        pickupTime: pickupTomorrow,
        pickupLocation: 'Downtown Santa Fe, near the Plaza',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },

      // Rosa's listings
      {
        sellerId: profileMap['rosa@example.com'].id,
        title: 'Red Chile Pork Tamales (Dozen)',
        description: 'Slow-cooked shredded pork in red chile sauce wrapped in fresh masa and corn husks. Made fresh every weekend.',
        price: 24.00,
        imageUrl: 'https://images.unsplash.com/photo-1530469525856-cf37954301f7?w=800',
        listingDate: weekend,
        pickupTime: pickupWeekend,
        pickupLocation: 'Santa Fe Place Mall area',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['rosa@example.com'].id,
        title: 'Green Chile & Cheese Tamales (Dozen)',
        description: 'Roasted green chile and Monterey Jack cheese in fresh masa. Vegetarian-friendly!',
        price: 22.00,
        imageUrl: 'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=800',
        listingDate: weekend,
        pickupTime: pickupWeekend,
        pickupLocation: 'Santa Fe Place Mall area',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
      {
        sellerId: profileMap['rosa@example.com'].id,
        title: 'Sweet Corn Tamales (Half Dozen)',
        description: 'Sweet corn masa with a hint of cinnamon. A perfect dessert tamale the whole family will love.',
        price: 12.00,
        imageUrl: 'https://images.unsplash.com/photo-1612549584500-c2a5da73ca3d?w=800',
        listingDate: weekend,
        pickupTime: pickupWeekend,
        pickupLocation: 'Santa Fe Place Mall area',
        city: 'Santa Fe',
        state: 'NM',
        zipCode: '87505',
      },
    ],
  })

  const listingCount = await prisma.foodListing.count()
  const sellerCount = await prisma.user.count()

  console.log(`Seeded ${sellerCount} sellers and ${listingCount} listings`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
