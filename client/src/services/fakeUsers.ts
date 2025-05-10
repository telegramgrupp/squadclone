// client/src/services/fakeUsers.ts

// Sahte kullanıcı tipi
export interface FakeUser {
  id: string;
  name: string;
  videoSrc: string;  // Video yolu
  avatar?: string;   // İsteğe bağlı avatar
  country?: string;  // İsteğe bağlı ülke
}

// Sahte kullanıcı listesi
export const fakeUsers: FakeUser[] = [
  {
    id: 'fake1',
    name: 'Emma Wilson',
    videoSrc: '/videos/fake1.mp4',
    country: 'United States'
  },
  {
    id: 'fake2',
    name: 'David Chen',
    videoSrc: '/videos/fake2.mp4',
    country: 'Canada'
  },
  {
    id: 'fake3',
    name: 'Sophia Lopez',
    videoSrc: '/videos/fake3.mp4',
    country: 'Spain'
  },
  {
    id: 'fake4',
    name: 'James Brown',
    videoSrc: '/videos/fake4.mp4',
    country: 'UK'
  },
  {
    id: 'fake5',
    name: 'Mia Johnson',
    videoSrc: '/videos/fake5.mp4',
    country: 'Australia'
  },
  {
    id: 'fake6',
    name: 'Alex Kim',
    videoSrc: '/videos/fake6.mp4',
    country: 'South Korea'
  },
  {
    id: 'fake7',
    name: 'Olivia Davis',
    videoSrc: '/videos/fake7.mp4',
    country: 'France'
  },
  {
    id: 'fake8',
    name: 'Mohammed Al-Farsi',
    videoSrc: '/videos/fake8.mp4',
    country: 'UAE'
  },
  {
    id: 'fake9',
    name: 'Anna Petrova',
    videoSrc: '/videos/fake9.mp4',
    country: 'Russia'
  },
  {
    id: 'fake10',
    name: 'Marco Silva',
    videoSrc: '/videos/fake10.mp4',
    country: 'Brazil'
  },
];

// Görüntülenen videoları takip etmek için localStorage kullanacağız
const VIEWED_VIDEOS_KEY = 'squadx_viewed_videos';

// Görüntülenen videoları alma
export function getViewedVideos(): string[] {
  const viewedJson = localStorage.getItem(VIEWED_VIDEOS_KEY);
  return viewedJson ? JSON.parse(viewedJson) : [];
}

// Görüntülenen bir videoyu kaydetme
export function markVideoAsViewed(userId: string): void {
  const viewed = getViewedVideos();
  if (!viewed.includes(userId)) {
    viewed.push(userId);
    localStorage.setItem(VIEWED_VIDEOS_KEY, JSON.stringify(viewed));
    console.log(`Video işaretlendi: ${userId}`);
  }
}

// Tüm görüntülenen videoları sıfırlama (test için)
export function resetViewedVideos(): void {
  localStorage.removeItem(VIEWED_VIDEOS_KEY);
  console.log('Görülen videolar sıfırlandı');
}

// Henüz görüntülenmemiş bir kullanıcı varsa onu döndür
export function getUnviewedFakeUser(): FakeUser | null {
  const viewed = getViewedVideos();
  const unviewed = fakeUsers.filter(user => !viewed.includes(user.id));
  
  // Eğer tüm kullanıcılar görüntülenmişse
  if (unviewed.length === 0) {
    console.log('Tüm videolar görüntülenmiş, null dönülüyor');
    return null;
  }
  
  // Rastgele bir görüntülenmemiş kullanıcı döndür
  const randomIndex = Math.floor(Math.random() * unviewed.length);
  return unviewed[randomIndex];
}

// Rastgele bir sahte kullanıcı seçme fonksiyonu
export function getRandomFakeUser(): FakeUser {
  const randomIndex = Math.floor(Math.random() * fakeUsers.length);
  return fakeUsers[randomIndex];
}

// Belirli bir kullanıcıyı ID'ye göre bulma fonksiyonu
export function getFakeUserById(id: string): FakeUser | undefined {
  return fakeUsers.find(user => user.id === id);
}