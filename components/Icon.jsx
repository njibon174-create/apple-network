// components/Icon.jsx
// Why: central lucide-react icon helper so pages/data can reference icons by name.
// Keeps icon imports in one place and lets data.js store plain string names.
import {
  Wallet, Receipt, Undo2, Trash2, Smartphone, Headphones, Laptop, Watch, Tv, Cpu,
  Search, ShoppingCart, Menu, Truck, CreditCard, ShieldCheck,
  RefreshCw, BadgeCheck, Star, Phone, Mail, MapPin, Clock,
  MessageCircle, Package, Home, CheckCircle2, Zap, Plus, Minus, ShoppingBag, Users,
  ChevronRight, X, FileText, Flame, TrendingUp, ThumbsUp, Heart,
  Lock, Store, PenTool, Share2, Code2, Palette, Boxes, Send,
  Sparkles, Globe, Settings, BarChart3, Rocket, FileEdit, LayoutGrid,
  BookOpen, Search as SearchIcon, Truck as TruckIcon, Building2,
} from "lucide-react";

const MAP = {
  Wallet, Receipt, Undo2, Trash2, Smartphone, Headphones, Laptop, Watch, Tv, Cpu,
  Search, ShoppingCart, Menu, Truck, CreditCard, ShieldCheck,
  RefreshCw, BadgeCheck, Star, Phone, Mail, MapPin, Clock,
  MessageCircle, Package, Home, CheckCircle2, Zap, Plus, Minus, ShoppingBag, Users,
  ChevronRight, X, FileText, Flame, TrendingUp, ThumbsUp, Heart,
  Lock, Store, PenTool, Share2, Code2, Palette, Boxes, Send,
  Sparkles, Globe, Settings, BarChart3, Rocket, FileEdit, LayoutGrid,
  BookOpen, Building2,
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 2 }) {
  const Cmp = MAP[name] || Boxes;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
