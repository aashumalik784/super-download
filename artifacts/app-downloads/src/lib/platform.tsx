import { SiYoutube, SiInstagram, SiTiktok, SiFacebook, SiX, SiReddit, SiVimeo } from "react-icons/si";
import { Link } from "lucide-react";
import { IconType } from "react-icons";

export interface PlatformDetails {
  name: string;
  icon: IconType | typeof Link;
  color: string;
  bg: string;
}

export function getPlatformInfo(urlOrPlatform: string): PlatformDetails {
  const s = urlOrPlatform.toLowerCase();
  
  if (s.includes('youtu')) {
    return { name: 'YouTube', icon: SiYoutube, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10' };
  }
  if (s.includes('instagram')) {
    return { name: 'Instagram', icon: SiInstagram, color: 'text-[#E1306C]', bg: 'bg-[#E1306C]/10' };
  }
  if (s.includes('tiktok')) {
    return { name: 'TikTok', icon: SiTiktok, color: 'text-foreground', bg: 'bg-foreground/10' };
  }
  if (s.includes('facebook') || s.includes('fb.watch')) {
    return { name: 'Facebook', icon: SiFacebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10' };
  }
  if (s.includes('twitter') || s.includes('x.com')) {
    return { name: 'X (Twitter)', icon: SiX, color: 'text-foreground', bg: 'bg-foreground/10' };
  }
  if (s.includes('reddit')) {
    return { name: 'Reddit', icon: SiReddit, color: 'text-[#FF4500]', bg: 'bg-[#FF4500]/10' };
  }
  if (s.includes('vimeo')) {
    return { name: 'Vimeo', icon: SiVimeo, color: 'text-[#1AB7EA]', bg: 'bg-[#1AB7EA]/10' };
  }

  return { name: 'URL', icon: Link, color: 'text-muted-foreground', bg: 'bg-muted' };
}
