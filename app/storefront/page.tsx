"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Package, IndianRupee, Search, MapPin, Phone, User, TrendingUp } from 'lucide-react';

export default function StorefrontPage() {
  const [items, setItems] = useState<any[]>([]);
  const [storefrontConfig, setStorefrontConfig] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'analytics'>('inventory');
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/storefront')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setStorefrontConfig(d.storefront || null);
      })
      .catch(console.error);

    // Fetch orders
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
      })
      .catch(console.error);
  }, []);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const value = searchQuery.toLowerCase();
    return String(item.name || '').toLowerCase().includes(value) || String(item.description || '').toLowerCase().includes(value);
  });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const handleCompleteOrder = async (orderId: string) => {
    setCompletingOrder(orderId);
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'completed' })
      });

      if (response.ok) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: 'completed' } : order
          )
        );
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('An error occurred while updating the order');
    } finally {
      setCompletingOrder(null);
    }
  };

  return (
    <main className="app-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 app-grid-bg opacity-35" />
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-gemini-blue-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-gemini-blue-700/20 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <header className="premium-card neon-panel mb-8 p-6 md:p-8 stagger-fade">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-gemini-blue-300">Shopkeeper Admin Panel</p>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gemini-blue-200 bg-clip-text text-transparent">{storefrontConfig?.shopName || 'Admin Panel'}</h1>
              <p className="mt-2 text-gemini-blue-200">Manage inventory, view orders, and track sales</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gemini-blue-500/30 bg-black/40 px-4 py-3 shadow-[0_0_18px_rgba(26,145,255,0.18)]">
              <Package className="h-5 w-5 text-gemini-blue-300" />
              <span className="text-sm text-gemini-blue-100">{totalOrders} Total Orders</span>
            </div>
          </div>
        </header>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="premium-card neon-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gemini-blue-300 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="premium-card neon-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gemini-blue-300 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{totalOrders}</p>
              </div>
              <ShoppingBag className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <div className="premium-card neon-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gemini-blue-300 text-sm mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-white">{pendingOrders}</p>
              </div>
              <Package className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gemini-blue-500/30">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'inventory'
                ? 'border-b-2 border-gemini-blue-400 text-white'
                : 'text-gemini-blue-300 hover:text-white'
            }`}
          >
            📦 Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'orders'
                ? 'border-b-2 border-gemini-blue-400 text-white'
                : 'text-gemini-blue-300 hover:text-white'
            }`}
          >
            🛒 Orders ({totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'analytics'
                ? 'border-b-2 border-gemini-blue-400 text-white'
                : 'text-gemini-blue-300 hover:text-white'
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <>
            <div className="premium-card neon-panel mb-6 p-4">
              <div className="relative">
                <Search className="h-4 w-4 text-gemini-blue-300 absolute left-3 top-3.5" />
                <input
                  className="premium-input pl-9 w-full"
                  placeholder="Search products in inventory"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((it) => (
                <article key={it.id} className="premium-card neon-panel group overflow-hidden p-4 transition-all duration-300 hover:border-gemini-blue-300/70 hover:-translate-y-1">
                  {it.image && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-gemini-blue-500/25 bg-black/40">
                      <img src={it.image} alt={it.name} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-white">{it.name}</h2>
                    <p className="line-clamp-2 text-sm text-gemini-blue-200">{it.description || 'No description added yet.'}</p>

                    <div className="flex items-center justify-between border-t border-gemini-blue-500/20 pt-3">
                      <span className="inline-flex items-center gap-1 text-xl font-bold text-white">
                        <IndianRupee className="h-4 w-4" />
                        {it.price}
                      </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-gemini-blue-500/30 bg-black/40 px-3 py-1 text-sm text-gemini-blue-100">
                        <Package className="h-4 w-4" />
                        Qty: {it.qty ?? 0}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="premium-card neon-panel mt-8 p-10 text-center">
                <h3 className="text-xl font-semibold text-white">No products found</h3>
                <p className="mt-2 text-gemini-blue-200">No products match your search. Try a different keyword.</p>
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="premium-card neon-panel p-10 text-center">
                <h3 className="text-xl font-semibold text-white">No orders yet</h3>
                <p className="mt-2 text-gemini-blue-200">Share your storefront link with customers to start receiving orders!</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="premium-card neon-panel p-6 border border-gemini-blue-500/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gemini-blue-500/20">
                    <div>
                      <p className="text-gemini-blue-300 text-sm mb-1">Order ID</p>
                      <p className="text-white font-semibold text-sm">{order.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-gemini-blue-300 text-sm mb-1">Date</p>
                      <p className="text-white font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gemini-blue-300 text-sm mb-1">Total</p>
                      <p className="text-green-400 font-bold">₹{order.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-gemini-blue-300 text-sm mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Customer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gemini-blue-200"><span className="text-gemini-blue-400 font-semibold">Name:</span> {order.customerName}</p>
                        <p className="text-gemini-blue-200 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {order.customerPhone}
                        </p>
                        <p className="text-gemini-blue-200 flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                          <span>{order.deliveryAddress}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Ordered Items
                      </h4>
                      <div className="space-y-2 text-sm">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-gemini-blue-200">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="text-white font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gemini-blue-500/20">
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={completingOrder === order.id}
                        className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/50"
                      >
                        {completingOrder === order.id ? (
                          <span className="flex items-center gap-2 justify-center">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Completing...
                          </span>
                        ) : (
                          '✓ Mark Delivery as Completed'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="premium-card neon-panel p-6 border border-gemini-blue-500/30">
                <h3 className="text-white font-semibold mb-4">Top Products</h3>
                <div className="space-y-3">
                  {items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gemini-blue-200">{idx + 1}. {item.name}</span>
                      <span className="text-white font-semibold">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card neon-panel p-6 border border-gemini-blue-500/30">
                <h3 className="text-white font-semibold mb-4">Customer Insights</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gemini-blue-300 text-sm">Total Customers</p>
                    <p className="text-2xl font-bold text-white">{new Set(orders.map(o => o.customerPhone)).size}</p>
                  </div>
                  <div>
                    <p className="text-gemini-blue-300 text-sm">Avg Order Value</p>
                    <p className="text-2xl font-bold text-white">₹{orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
