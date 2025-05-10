const { PrismaClient } = require('./prisma/generated/client1');
const prisma = new PrismaClient();

async function main() {
  try {
    // İlk test kullanıcısını oluştur
    const user1 = await prisma.user.upsert({
      where: { username: 'test1' },
      update: {},
      create: {
        username: 'test1',
        email: 'test1@example.com',
        name: 'Test User 1',
        pfp: 'default',
        about: 'default'
      },
    });

    // İkinci test kullanıcısını oluştur
    const user2 = await prisma.user.upsert({
      where: { username: 'test2' },
      update: {},
      create: {
        username: 'test2',
        email: 'test2@example.com',
        name: 'Test User 2',
        pfp: 'default',
        about: 'default'
      },
    });

    console.log('Test kullanıcıları oluşturuldu:', { user1, user2 });
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
