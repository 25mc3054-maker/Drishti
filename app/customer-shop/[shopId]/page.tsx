'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, MapPin, Phone, User } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  description: string;
  image: string;
}

interface CartItem extends Product {
  cartQty: number;
}

interface ShopConfig {
  shopName: string;
  tagline: string;
  ownerLogin: string;
  operationGuide: string[];
}

export default function CustomerShopPage() {
  const routeParams = useParams<{ shopId?: string | string[] }>();
  const shopId = Array.isArray(routeParams.shopId) ? routeParams.shopId[0] : routeParams.shopId;

  const [products, setProducts] = useState<Product[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopConfig | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Fetch products and shop info
  useEffect(() => {
    if (!shopId) {
      return;
    }

    const fetchShopData = async () => {
      try {
        const res = await fetch(`/api/shop/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setShopInfo(data.shopInfo);
        }
      } catch (error) {
        console.error('Failed to fetch shop data:', error);
      }
    };

    fetchShopData();
  }, [shopId]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.cartQty < product.qty) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item
        ));
      }
    } else {
      setCart([...cart, { ...product, cartQty: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      const product = products.find(p => p.id === productId);
      if (product && qty <= product.qty) {
        setCart(cart.map(item =>
          item.id === productId ? { ...item, cartQty: qty } : item
        ));
      }
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.cartQty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.cartQty, 0);

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('Please fill all customer information');
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    try {
      if (!shopId) {
        alert('Shop information is not available right now. Please refresh and try again.');
        return;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          shopName: shopInfo?.shopName || 'Shop',
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          deliveryAddress: customerInfo.address,
          items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.cartQty,
            category: item.category,
          })),
          totalAmount: cartTotal,
          status: 'pending',
        }),
      });

      if (res.ok) {
        setOrderPlaced(true);
        setCart([]);
        setCustomerInfo({ name: '', phone: '', address: '' });
        setTimeout(() => setShowCheckout(false), 3000);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-blue-500/30 shadow-2xl shadow-blue-500/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {shopInfo?.shopName || 'Digital Store'}
            </h1>
            <p className="text-sm text-cyan-300/80 mt-1">{shopInfo?.tagline || 'Your neighborhood shop, now online!'}</p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 hover:scale-105"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center animate-bounce shadow-lg">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-gray-800/50 backdrop-blur-xl text-white placeholder-gray-400 border border-blue-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-lg shadow-blue-500/10 text-lg"
          />
        </div>

        {/* Main Content */}
        {!showCart ? (
          <>
            {/* Category Filter */}
            <div className="mb-8 flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold whitespace-nowrap hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50 hover:scale-105"
              >
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSearchQuery(cat)}
                  className="px-6 py-3 rounded-xl bg-gray-800/60 backdrop-blur-xl border border-blue-500/30 text-gray-100 font-semibold whitespace-nowrap hover:bg-gray-700/60 hover:border-cyan-400/50 transition-all hover:scale-105"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-2"
                >
                  {product.image && (
                    <div className="relative overflow-hidden rounded-xl mb-4 border border-blue-500/20">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <span className="inline-block text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1 rounded-full font-semibold shadow-lg">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{product.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-blue-500/20">
                      <div>
                        <p className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">₹{product.price}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.qty > 0 ? `${product.qty} in stock` : 'Out of stock'}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.qty === 0}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400 text-xl font-semibold">No products found</p>
                <p className="text-gray-500 mt-2">Try a different search term</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Cart View */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 shadow-2xl">
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8">Shopping Cart</h2>

              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-7xl mb-4">🛒</div>
                  <p className="text-gray-400 text-xl font-semibold">Your cart is empty</p>
                  <p className="text-gray-500 mt-2">Add some products to get started!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="bg-gray-900/60 backdrop-blur-xl rounded-xl p-5 flex items-center justify-between border border-blue-500/20 hover:border-cyan-400/40 transition-all group"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">{item.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">₹{item.price} each</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => updateCartQty(item.id, item.cartQty - 1)}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-all hover:scale-110 border border-blue-500/20"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold text-lg w-12 text-center">{item.cartQty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, item.cartQty + 1)}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-all hover:scale-110 border border-blue-500/20"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-green-400 font-bold text-xl w-24 text-right">
                            ₹{item.price * item.cartQty}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white p-2.5 rounded-lg ml-2 transition-all hover:scale-110 shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-blue-500/30 pt-6 mb-8">
                    <div className="flex justify-between mb-3 text-lg">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white font-bold">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between mb-3 text-lg">
                      <span className="text-gray-400">Delivery:</span>
                      <span className="text-green-400 font-bold">Free</span>
                    </div>
                    <div className="flex justify-between text-2xl border-t border-blue-500/30 pt-4">
                      <span className="text-white font-black">Total:</span>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-black">₹{cartTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 text-lg"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-blue-500/30 shadow-2xl shadow-blue-500/20 animate-in zoom-in duration-300">
              {orderPlaced ? (
                <div className="text-center space-y-6">
                  <div className="text-7xl animate-bounce">✅</div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Order Placed!</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Your order has been placed successfully. The shopkeeper will contact you soon.
                  </p>
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setShowCart(false);
                      setOrderPlaced(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 shadow-lg"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <h3 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">Delivery Information</h3>

                  <div>
                    <label className="text-gray-300 text-sm font-semibold block mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-900/60 backdrop-blur-xl text-white border border-blue-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-semibold block mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-900/60 backdrop-blur-xl text-white border border-blue-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                      placeholder="10-digit phone number"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-semibold block mb-2">Delivery Address *</label>
                    <textarea
                      value={customerInfo.address}
                      onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-900/60 backdrop-blur-xl text-white border border-blue-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all h-24 resize-none"
                      placeholder="Complete delivery address"
                    />
                  </div>

                  <div className="bg-gray-900/60 backdrop-blur-xl p-4 rounded-xl border border-blue-500/30 space-y-2">
                    <p className="text-sm text-gray-300">
                      <span className="font-bold text-white">Total Items:</span> {cartCount}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-bold text-white">Total Amount:</span>{' '}
                      <span className="text-green-400 font-bold text-lg">₹{cartTotal}</span>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 bg-gray-700/80 backdrop-blur-xl hover:bg-gray-600/80 text-white font-semibold py-3 rounded-xl transition-all border border-gray-600 hover:border-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/50 hover:scale-105"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
