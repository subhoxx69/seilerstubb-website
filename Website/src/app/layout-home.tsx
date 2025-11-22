'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChefHat, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Users, 
  Utensils,
  ArrowRight,
  Heart,
  Award,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: ChefHat,
      title: 'Premium Cuisine',
      description: 'Expertly crafted dishes using the finest ingredients'
    },
    {
      icon: Clock,
      title: 'Fresh Daily',
      description: 'Prepared fresh every day with passion and care'
    },
    {
      icon: Users,
      title: 'Welcoming Atmosphere',
      description: 'Perfect place for families, friends, and celebrations'
    },
    {
      icon: Award,
      title: 'Award Winning',
      description: 'Recognized for excellence in service and cuisine'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Food Enthusiast',
      message: 'The best dining experience I\'ve had in years. Absolutely exceptional!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Business Professional',
      message: 'Perfect for both casual lunches and important dinners. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Travel Blogger',
      message: 'A hidden gem with world-class service and delicious food. Must visit!',
      rating: 5
    }
  ];

  return (
    <div className="w-full">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Seilerstubb
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#menu" className="text-gray-700 hover:text-orange-600 transition">Menu</Link>
              <Link href="#about" className="text-gray-700 hover:text-orange-600 transition">About</Link>
              <Link href="#contact" className="text-gray-700 hover:text-orange-600 transition">Contact</Link>
              <Link href="/routes/user/reservation" className="text-gray-700 hover:text-orange-600 transition">Reservations</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 py-32 md:py-48">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-96 h-96 bg-orange-500 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-amber-500 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  Experience <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Culinary</span> Excellence
                </h1>
                <p className="text-xl text-gray-300">
                  Discover exceptional cuisine and warm hospitality in an elegant atmosphere
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/routes/user/menu">
                  <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-6 text-lg rounded-lg w-full sm:w-auto group">
                    Browse Menu
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/routes/user/reservation">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto">
                    Reserve Table
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-300">4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300">5000+ Guests</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
                  <ChefHat className="w-32 h-32 text-orange-600/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-xl text-gray-600">Exceptional service and quality that sets us apart</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="pt-8">
                    <div className="space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center group-hover:from-orange-200 group-hover:to-amber-200 transition-all">
                        <Icon className="w-7 h-7 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="menu" className="py-20 md:py-32 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-xl">
                <Utensils className="w-32 h-32 text-white/30" />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Discover Our <span className="text-orange-600">Menu</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                From traditional favorites to innovative creations, our carefully curated menu offers something for every palate. Each dish is prepared with attention to detail and the finest ingredients.
              </p>
              <ul className="space-y-3">
                {['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Special Offers'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/routes/user/menu">
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-6 text-lg rounded-lg group">
                  View Full Menu
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Guests Say</h2>
            <p className="text-xl text-gray-600">Real experiences from our valued customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-gray-100 hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed italic">"{testimonial.message}"</p>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Gallery</h2>
            <p className="text-xl text-gray-600">A visual journey through our restaurant</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="aspect-square rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center hover:shadow-lg transition-all group cursor-pointer overflow-hidden">
                <div className="w-full h-full bg-gray-900/40 group-hover:bg-gray-900/60 transition-all flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-white/40 group-hover:text-white/60 transition-all" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/routes/user/gallery">
              <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-6 text-lg rounded-lg">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                <p className="text-lg text-gray-600">We'd love to hear from you. Reach out to us today.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Call Us</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">info@seilerstubb.com</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Location</h3>
                    <p className="text-gray-600">123 Restaurant Street, City, State 12345</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Hours</h3>
                    <p className="text-gray-600">Mon-Sun: 11:00 AM - 10:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Link href="/routes/user/contact">
                <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-6 text-lg rounded-lg h-auto">
                  Send Message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Seilerstubb</h3>
              <p className="text-sm">Exceptional dining experiences since 1990.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/routes/user/menu" className="hover:text-orange-400">Menu</Link></li>
                <li><Link href="/routes/user/reservation" className="hover:text-orange-400">Reservations</Link></li>
                <li><Link href="/routes/user/gallery" className="hover:text-orange-400">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#privacy" className="hover:text-orange-400">Privacy Policy</Link></li>
                <li><Link href="#terms" className="hover:text-orange-400">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Follow Us</h3>
              <p className="text-sm">Connect with us on social media</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Seilerstubb. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
