import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function LandingPage() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-green-800">ReWear</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to={loggedInUser ? "/browse" : "/auth"} className="text-gray-600 hover:text-green-700 font-medium">
                Browse Items
              </Link>
              {loggedInUser ? (
                <Link
                  to="/dashboard"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-6">
            Join the <span className="text-emerald-600">ReWear</span> Movement
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your wardrobe sustainably. Swap, redeem, and discover pre-loved fashion 
            while earning eco-points and reducing textile waste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={loggedInUser ? "/browse" : "/auth"}
              className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Start Swapping Now
            </Link>
            <Link
              to={loggedInUser ? "/browse" : "/auth"}
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl hover:bg-green-50 transition-colors font-semibold text-lg"
            >
              Browse Items
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
            Featured Items
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Vintage Denim Jacket",
                image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
                ecoScore: 95,
                points: 25,
              },
              {
                title: "Designer Silk Dress",
                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
                ecoScore: 88,
                points: 40,
              },
              {
                title: "Sustainable Sneakers",
                image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
                ecoScore: 92,
                points: 30,
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Eco Score: {item.ecoScore}</span>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item.points} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📦",
                title: "List Your Items",
                description: "Upload photos and details of clothes you no longer wear. Earn points for every listing!",
              },
              {
                icon: "🔄",
                title: "Swap & Discover",
                description: "Browse amazing pre-loved items and request swaps with other community members.",
              },
              {
                icon: "🌱",
                title: "Earn Eco-Points",
                description: "Complete swaps to earn points and build your eco-score. Redeem points for premium items!",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Items Swapped" },
              { number: "5K+", label: "Happy Members" },
              { number: "50K+", label: "Eco-Points Earned" },
              { number: "2.5T", label: "CO₂ Saved (kg)" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold">ReWear</span>
              </div>
              <p className="text-gray-400">
                Building a sustainable future through community-driven fashion exchange.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-white">Browse Items</Link></li>
                <li><Link to="/auth" className="hover:text-white">Join Community</Link></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Community Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ReWear. All rights reserved. Made with 💚 for the planet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
