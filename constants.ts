import { ClothingItem, Outfit } from './types';

// Helper to generate dates
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const MOCK_WARDROBE: ClothingItem[] = [
  {
    id: '1',
    name: 'Vintage Denim Jacket',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=600',
    wearCount: 14,
    lastWorn: daysAgo(2),
    color: 'Blue',
    brand: 'Levi\'s',
    addedDate: daysAgo(120),
  },
  {
    id: '2',
    name: 'White Linen Shirt',
    category: 'Top',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600',
    wearCount: 8,
    lastWorn: daysAgo(5),
    color: 'White',
    brand: 'Uniqlo',
    addedDate: daysAgo(90),
  },
  {
    id: '3',
    name: 'Pleated Chino Pants',
    category: 'Bottom',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600',
    wearCount: 22,
    lastWorn: daysAgo(1),
    color: 'Beige',
    brand: 'Zara',
    addedDate: daysAgo(200),
  },
  {
    id: '4',
    name: 'Leather Chelsea Boots',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=600',
    wearCount: 45,
    lastWorn: daysAgo(3),
    color: 'Black',
    brand: 'Dr. Martens',
    addedDate: daysAgo(300),
  },
  {
    id: '5',
    name: 'Cashmere Sweater',
    category: 'Top',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600',
    wearCount: 5,
    lastWorn: daysAgo(45), // Forgotten item
    color: 'Grey',
    brand: 'Everlane',
    addedDate: daysAgo(60),
  },
  {
    id: '6',
    name: 'Silk Scarf',
    category: 'Accessory',
    image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format&fit=crop&q=80&w=600',
    wearCount: 2,
    lastWorn: daysAgo(60), // Forgotten item
    color: 'Red Pattern',
    addedDate: daysAgo(150),
  },
  {
    id: '7',
    name: 'Canvas High Tops',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=600',
    wearCount: 18,
    lastWorn: daysAgo(8),
    color: 'Black',
    brand: 'Converse',
    addedDate: daysAgo(90),
  },
  {
    id: '8',
    name: 'Oversized Tee',
    category: 'Top',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600',
    wearCount: 30,
    lastWorn: daysAgo(2),
    color: 'White',
    addedDate: daysAgo(200),
  },
  {
    id: '9',
    name: 'Wool Blend Coat',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=600',
    wearCount: 12,
    lastWorn: daysAgo(10),
    color: 'Camel',
    addedDate: daysAgo(365),
  },
  {
    id: '10',
    name: 'Black Skinny Jeans',
    category: 'Bottom',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
    wearCount: 50,
    lastWorn: daysAgo(4),
    color: 'Black',
    brand: 'Levi\'s',
    addedDate: daysAgo(400),
  },
  {
    id: '11',
    name: 'Floral Summer Dress',
    category: 'Top', // Categorized as top/body logic for simplicity
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600',
    wearCount: 3,
    lastWorn: daysAgo(100),
    color: 'Multi',
    addedDate: daysAgo(120),
  },
  {
    id: '12',
    name: 'Running Shoes',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    wearCount: 80,
    lastWorn: daysAgo(1),
    color: 'Red',
    brand: 'Nike',
    addedDate: daysAgo(300),
  }
];

export const MOCK_OUTFITS: Outfit[] = [
  { id: 'o1', date: daysAgo(1), items: ['3', '8', '12'] },
  { id: 'o2', date: daysAgo(2), items: ['1', '8', '10', '4'] },
  { id: 'o3', date: daysAgo(3), items: ['2', '10', '4'] },
  { id: 'o4', date: daysAgo(4), items: ['5', '3', '7'] },
  { id: 'o5', date: daysAgo(5), items: ['2', '10', '7'] },
];