import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  Star, 
  ArrowRight, 
  Globe, 
  Shield, 
  Zap, 
  Target,
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  Video,
  Headphones,
  Smartphone,
  Laptop,
  Monitor,
  GraduationCap,
  Lightbulb,
  Clock,
  UserCheck,
  Settings,
  Bell
} from 'lucide-react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Course Library",
      description: "Access thousands of courses across various disciplines with expert instructors and up-to-date content."
    },
    {
      icon: Users,
      title: "Expert Instructors",
      description: "Learn from industry professionals and academic experts who bring real-world experience to the classroom."
    },
    {
      icon: Award,
      title: "Certificates & Credentials",
      description: "Earn recognized certificates and credentials that boost your career prospects and professional credibility."
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and personalized insights to optimize your study time."
    },
    {
      icon: Video,
      title: "Live Sessions",
      description: "Join interactive live classes, Q&A sessions, and collaborative learning experiences with peers and instructors."
    },
    {
      icon: Target,
      title: "Personalized Learning",
      description: "AI-powered recommendations and adaptive learning paths tailored to your goals and learning style."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Students" },
    { number: "500+", label: "Expert Instructors" },
    { number: "1000+", label: "Courses Available" },
    { number: "95%", label: "Success Rate" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      content: "EduTech transformed my career. The hands-on projects and expert guidance helped me land my dream job at a tech startup.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Data Scientist",
      content: "The data science track was incredible. Real-world datasets and industry mentors made all the difference in my learning journey.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      content: "The design courses are top-notch. I learned cutting-edge tools and methodologies that I use daily in my design work.",
      rating: 5,
      avatar: "ER"
    }
  ];

  // macOS design no longer uses platforms dock

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-50">
      {/* Ambient radial lights */}
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.25),transparent),radial-gradient(900px_500px_at_80%_-10%,rgba(56,189,248,0.2),transparent)]"></div>
      {/* Navigation - macOS-style translucent menu bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-black/30 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm tracking-tight text-white">EduTech</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="text-slate-300 hover:text-white">Features</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white">Reviews</a>
              <a href="#pricing" className="text-slate-300 hover:text-white">Pricing</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="h-8 px-3 text-slate-200 hover:text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="h-8 px-3 bg-white text-slate-900 hover:bg-slate-100">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - macOS glass + window */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs text-gray-700 shadow-sm backdrop-blur-xl">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                  Live and constantly improving
                </div>
                <h1 className="text-4xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight">
                  Learn beautifully.
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">The macOS way.</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  A calm, focused space to master new skills with elegant design, smooth interactions, and powerful tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-6 rounded-2xl bg-gray-900 text-white hover:bg-black/90">
                    Get started free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-12 px-6 rounded-2xl border-gray-300/70 bg-white/60 backdrop-blur-xl hover:bg-white">
                  <Play className="w-5 h-5 mr-2" />
                  Watch demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full border border-white bg-gradient-to-br from-gray-200 to-white shadow-sm flex items-center justify-center text-[11px] font-medium text-gray-700">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">50,000+ learners</div>
                  <div>trust EduTech every day</div>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/60">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400"></span>
                    <span className="h-3 w-3 rounded-full bg-yellow-300"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-xs text-gray-500">Dashboard – EduTech</div>
                  <div className="h-5 w-20 rounded-md bg-gray-200/70"></div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">12</div>
                          <div className="text-xs text-gray-500">Courses</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">8</div>
                          <div className="text-xs text-gray-500">Certificates</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Learning Progress</span>
                      <span className="text-gray-500">75%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-gradient-to-r from-gray-900 to-gray-600" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 backdrop-blur-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Video className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">React Fundamentals</div>
                        <div className="text-xs text-gray-500">Next: State Management</div>
                      </div>
                      <Play className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Thoughtfully crafted tools that feel right at home on macOS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow rounded-3xl">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">Get started in minutes and begin your learning journey today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign Up & Choose</h3>
              <p className="text-gray-600">Create your account and browse our extensive course catalog to find the perfect learning path.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-900">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Learn & Practice</h3>
              <p className="text-gray-600">Access video lessons, interactive exercises, and hands-on projects designed by industry experts.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-semibold text-gray-900">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Certified</h3>
              <p className="text-gray-600">Complete courses and earn industry-recognized certificates to showcase your new skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">What our students say</h2>
            <p className="text-lg text-gray-600">Join thousands of successful learners who have transformed their careers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-10">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">Ready to start your journey?</h2>
            <p className="text-lg text-gray-600 mb-8">Join learners who prefer calm, delightful design without distractions.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-6 rounded-2xl bg-gray-900 text-white hover:bg-black/90">
                  Get started free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-6 rounded-2xl border-gray-300/70 bg-white hover:bg-white">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-sm tracking-tight text-gray-700">EduTech</span>
              </div>
              <p className="text-gray-600 max-w-md">
                Empowering learners with elegant tools and an experience inspired by macOS.
              </p>
              <div className="flex gap-3 mt-6">
                <div className="w-9 h-9 rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center text-gray-700 hover:bg-white cursor-pointer">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center text-gray-700 hover:bg-white cursor-pointer">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl flex items-center justify-center text-gray-700 hover:bg-white cursor-pointer">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Platform</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-gray-900">Courses</a></li>
                <li><a href="#" className="hover:text-gray-900">Instructors</a></li>
                <li><a href="#" className="hover:text-gray-900">Certificates</a></li>
                <li><a href="#" className="hover:text-gray-900">Live Sessions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 text-center text-sm text-gray-500">&copy; 2024 EduTech. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
