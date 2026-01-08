import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  inStock: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);

  const categories = [
    { id: 'all', name: 'Все товары', icon: 'Grid3x3' },
    { id: 'tools', name: 'Инструменты', icon: 'Wrench' },
    { id: 'home', name: 'Для дома', icon: 'Home' },
    { id: 'garden', name: 'Для сада', icon: 'TreePine' },
    { id: 'repair', name: 'Ремонт', icon: 'Hammer' },
    { id: 'plumbing', name: 'Сантехника', icon: 'Droplet' },
  ];

  const products: Product[] = [
    { id: 1, name: 'Набор отвёрток 12 шт', category: 'tools', price: 599, oldPrice: 799, discount: 25, image: '/placeholder.svg', inStock: true },
    { id: 2, name: 'Лампочка LED E27 10W', category: 'home', price: 149, image: '/placeholder.svg', inStock: true },
    { id: 3, name: 'Садовые ножницы', category: 'garden', price: 299, oldPrice: 399, discount: 25, image: '/placeholder.svg', inStock: true },
    { id: 4, name: 'Лента малярная 50мм', category: 'repair', price: 89, image: '/placeholder.svg', inStock: true },
    { id: 5, name: 'Смеситель для раковины', category: 'plumbing', price: 1299, oldPrice: 1599, discount: 19, image: '/placeholder.svg', inStock: true },
    { id: 6, name: 'Саморезы 3.5x25 (200шт)', category: 'tools', price: 119, image: '/placeholder.svg', inStock: true },
    { id: 7, name: 'Выключатель одноклавишный', category: 'home', price: 79, image: '/placeholder.svg', inStock: true },
    { id: 8, name: 'Перчатки садовые', category: 'garden', price: 129, oldPrice: 179, discount: 28, image: '/placeholder.svg', inStock: true },
    { id: 9, name: 'Шпатель 100мм', category: 'repair', price: 99, image: '/placeholder.svg', inStock: true },
    { id: 10, name: 'Гибкая подводка 50см', category: 'plumbing', price: 149, image: '/placeholder.svg', inStock: true },
    { id: 11, name: 'Уровень строительный 60см', category: 'tools', price: 449, oldPrice: 599, discount: 25, image: '/placeholder.svg', inStock: true },
    { id: 12, name: 'Розетка двойная с заземлением', category: 'home', price: 119, image: '/placeholder.svg', inStock: true },
  ];

  const promoCodes = {
    'SALE10': 10,
    'SALE20': 20,
    'WELCOME': 15,
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} добавлен в корзину`);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    if (promoCodes[code as keyof typeof promoCodes]) {
      setPromoDiscount(promoCodes[code as keyof typeof promoCodes]);
      toast.success(`Промокод применён! Скидка ${promoCodes[code as keyof typeof promoCodes]}%`);
    } else {
      toast.error('Неверный промокод');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = (cartTotal * promoDiscount) / 100;
  const finalTotal = cartTotal - totalDiscount;

  const exportToExcel = () => {
    const exportData = products.map(product => ({
      'ID': product.id,
      'Название': product.name,
      'Категория': categories.find(c => c.id === product.category)?.name || product.category,
      'Цена': product.price,
      'Старая цена': product.oldPrice || '',
      'Скидка %': product.discount || '',
      'В наличии': product.inStock ? 'Да' : 'Нет'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Товары');
    XLSX.writeFile(wb, 'каталог_товаров_1000_мелочей.xlsx');
    toast.success('Каталог экспортирован в Excel!');
  };

  const exportCartToExcel = () => {
    if (cart.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    const cartData = cart.map(item => ({
      'Название': item.name,
      'Цена за шт.': item.price,
      'Количество': item.quantity,
      'Сумма': item.price * item.quantity
    }));

    cartData.push({
      'Название': '',
      'Цена за шт.': '',
      'Количество': 'ИТОГО:',
      'Сумма': cartTotal
    } as any);

    if (promoDiscount > 0) {
      cartData.push({
        'Название': '',
        'Цена за шт.': '',
        'Количество': `Скидка ${promoDiscount}%:`,
        'Сумма': -totalDiscount
      } as any);
      cartData.push({
        'Название': '',
        'Цена за шт.': '',
        'Количество': 'К ОПЛАТЕ:',
        'Сумма': finalTotal
      } as any);
    }

    const ws = XLSX.utils.json_to_sheet(cartData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Заказ');
    XLSX.writeFile(wb, `заказ_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    toast.success('Заказ экспортирован в Excel!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Icon name="Store" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">1.000 мелочей</h1>
                <p className="text-xs text-muted-foreground">Всё для дома и ремонта</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={exportToExcel}>
                <Icon name="FileSpreadsheet" size={20} />
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="relative">
                    <Icon name="ShoppingCart" size={20} />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Корзина</SheetTitle>
                  <SheetDescription>
                    {cart.length === 0 ? 'Ваша корзина пуста' : `Товаров: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`}
                  </SheetDescription>
                </SheetHeader>

                {cart.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {cart.map(item => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{item.name}</h4>
                              <p className="text-lg font-bold text-primary mt-1">{item.price} ₽</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                                  <Icon name="Minus" size={14} />
                                </Button>
                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                                  <Icon name="Plus" size={14} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)} className="ml-auto">
                                  <Icon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Промокод"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="uppercase"
                        />
                        <Button onClick={applyPromoCode} variant="secondary">
                          Применить
                        </Button>
                      </div>

                      {promoDiscount > 0 && (
                        <div className="bg-secondary/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-secondary flex items-center gap-2">
                            <Icon name="Tag" size={16} />
                            Скидка по промокоду: {promoDiscount}% (-{totalDiscount.toFixed(0)} ₽)
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Сумма товаров:</span>
                          <span className="font-semibold">{cartTotal} ₽</span>
                        </div>
                        {promoDiscount > 0 && (
                          <div className="flex justify-between text-secondary">
                            <span>Скидка:</span>
                            <span className="font-semibold">-{totalDiscount.toFixed(0)} ₽</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Итого:</span>
                          <span className="text-primary">{finalTotal.toFixed(0)} ₽</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={exportCartToExcel}>
                          <Icon name="FileDown" size={16} className="mr-2" />
                          Excel
                        </Button>
                        <Button className="flex-1" size="lg" onClick={() => toast.success('Заказ оформлен!')}>
                          Оформить
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon name="ShoppingCart" size={64} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Добавьте товары в корзину</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 bg-gradient-to-r from-secondary to-orange-400 text-white p-6 rounded-lg">
          <div className="flex items-center gap-3">
            <Icon name="Tag" size={32} />
            <div>
              <h2 className="text-2xl font-bold">Акции и спецпредложения</h2>
              <p className="text-sm opacity-90">Используйте промокоды: SALE10, SALE20, WELCOME</p>
            </div>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <Icon name={cat.icon as any} size={16} />
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="p-0 relative">
                  {product.discount && (
                    <Badge className="absolute top-2 right-2 bg-secondary text-white z-10">
                      -{product.discount}%
                    </Badge>
                  )}
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-base mb-2">{product.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mb-3">
                    {categories.find(c => c.id === product.category)?.name}
                  </CardDescription>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{product.price} ₽</span>
                    {product.oldPrice && (
                      <span className="text-sm text-muted-foreground line-through">{product.oldPrice} ₽</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full" 
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                  >
                    <Icon name="ShoppingCart" size={16} className="mr-2" />
                    В корзину
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Icon name="Phone" size={20} />
                Контакты
              </h3>
              <p className="text-sm text-muted-foreground">Тел: +7 (999) 123-45-67</p>
              <p className="text-sm text-muted-foreground">Email: info@1000melochey.ru</p>
            </div>
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Icon name="Truck" size={20} />
                Доставка
              </h3>
              <p className="text-sm text-muted-foreground">Бесплатная доставка от 2000 ₽</p>
              <p className="text-sm text-muted-foreground">Доставка по городу — 250 ₽</p>
            </div>
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Icon name="Clock" size={20} />
                Режим работы
              </h3>
              <p className="text-sm text-muted-foreground">Пн-Пт: 9:00 - 20:00</p>
              <p className="text-sm text-muted-foreground">Сб-Вс: 10:00 - 18:00</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;