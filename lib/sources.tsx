import { 
  Home, 
  Mail, 
  MessageSquare, 
  Phone, 
  Globe, 
  Facebook, 
  Layers, 
  LucideIcon, 
  MessageCircle,
  Hash,
  AtSign,
  Smartphone,
  FileText,
  Hand
} from "lucide-react";

export interface SourceInfo {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const SOURCE_ICONS: Record<string, LucideIcon> = {
  zillow: Home,
  airbnb: Globe,
  facebook: Facebook,
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageCircle,
  craigslist: FileText,
  manual: Hand,
};

export const SOURCE_NAMES: Record<string, string> = {
  all: 'All Messages',
  zillow: 'Zillow',
  airbnb: 'Airbnb',
  facebook: 'Facebook',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  craigslist: 'Craigslist',
  manual: 'Manual Entry',
};

export const SMART_FILTERS = [
  { id: 'all', name: 'All', icon: Layers },
  { id: 'priority', name: 'Priority', icon: AtSign },
  { id: 'followup', name: 'Follow-ups', icon: Hash },
];
