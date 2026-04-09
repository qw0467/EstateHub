import { Link } from "react-router-dom";
import { Home, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Home className="h-5 w-5 text-primary" />
            <span className="text-white font-bold text-lg">EstateHub</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your trusted partner for finding, booking, and investing in premium properties. Members get exclusive access to market insights and priority viewings.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/properties" className="hover:text-white transition-colors">All Properties</Link></li>
            <li><Link to="/exclusive" className="hover:text-white transition-colors">Exclusive Listings</Link></li>
            <li><Link to="/membership" className="hover:text-white transition-colors">Membership Plans</Link></li>
            <li><Link to="/members" className="hover:text-white transition-colors">Members Portal</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li>
              <a href="mailto:support@estatehub.com" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> support@estatehub.com
              </a>
            </li>
            <li>
              <a href="tel:+442079460000" className="hover:text-white transition-colors flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> +44 20 7946 0000
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Account</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/auth" className="hover:text-white transition-colors">Sign In</Link></li>
            <li><Link to="/auth" className="hover:text-white transition-colors">Create Account</Link></li>
            <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} EstateHub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms & Conditions</Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
