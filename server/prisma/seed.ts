import { PrismaClient } from '../prisma/generated/client1';

const prisma = new PrismaClient();

async function main() {
  try {
    // Test kullanıcıları oluştur
    const users = [
      {
        username: 'test1',
        email: 'test1@example.com',
        name: 'Test User 1',
        pfp: 'default',
        about: 'Test kullanıcı 1 açıklaması'
      },
      {
        username: 'test2',
        email: 'test2@example.com',
        name: 'Test User 2',
        pfp: 'default',
        about: 'Test kullanıcı 2 açıklaması'
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        pfp: 'default',
        about: 'Yönetici kullanıcı'
      }
    ];

    console.log('Test kullanıcıları oluşturuluyor...');

    // Her kullanıcı için upsert işlemi
    for (const user of users) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: user,
        create: user,
      });
      console.log(`Kullanıcı ${user.username} oluşturuldu veya güncellendi`);
    }

    console.log('Seed işlemi tamamlandı!');
  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });