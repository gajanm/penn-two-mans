import { User, MapPin, Coffee, Heart, Calendar, MessageCircle, Settings, Users } from "lucide-react";

export const currentUser = {
  id: "u1",
  name: "Sarah",
  email: "sarah@upenn.edu",
  partnerId: "u2",
  matchStatus: "matched",
};

export const friends = [
  {
    id: "u2",
    name: "Jessica",
    status: "Available",
    major: "Psychology '25",
    funFact: "Can recite the entire script of Mean Girls",
  },
  {
    id: "u3",
    name: "Emily",
    status: "Paired",
    major: "Nursing '24",
    funFact: "Has a pet hedgehog named Sonic",
  },
  {
    id: "u4",
    name: "Olivia",
    status: "Available",
    major: "Wharton '25",
    funFact: "Started a coffee bean review blog",
  },
];

export const currentMatch = {
  pairId: "m1",
  names: ["Michael", "David"],
  compatibilityScore: 94,
  sharedValues: ["Ambition", "Creativity", "Family"],
  reason: "You both value deep conversation over small talk and share a love for Philadelphia's art scene.",
};

export const dateSpots = [
  {
    id: "d1",
    name: "Talula's Garden",
    type: "Restaurant",
    image: "/attached_assets/generated_images/cozy_romantic_restaurant_interior_in_philadelphia..png",
    description: "Farm-to-table dining in a magical garden setting.",
    price: "$$$",
    distance: "1.2 mi",
    votes: 2,
  },
  {
    id: "d2",
    name: "Art Museum Sunset",
    type: "Activity",
    image: "/attached_assets/generated_images/philadelphia_skyline_view_from_art_museum_steps_at_sunset..png",
    description: "Watch the sun go down over the city from the iconic steps.",
    price: "Free",
    distance: "1.5 mi",
    votes: 1,
  },
  {
    id: "d3",
    name: "Rittenhouse Picnic",
    type: "Activity",
    image: "/attached_assets/generated_images/collage_style_image_of_philadelphia_romantic_spots..png",
    description: "Grab some cheese and wine for a relaxed afternoon.",
    price: "$",
    distance: "0.8 mi",
    votes: 3,
  },
  {
    id: "d4",
    name: "Double Knot",
    type: "Restaurant",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
    description: "Cozy downstairs izakaya perfect for double dates.",
    price: "$$$",
    distance: "1.1 mi",
    votes: 0,
  },
];

export const chatMessages = [
  {
    id: "c1",
    senderId: "u2",
    text: "Omg hi everyone! So excited we matched!",
    timestamp: "10:30 AM",
  },
  {
    id: "c2",
    senderId: "m1-1",
    text: "Hey! Yeah, great to meet you all. I see we all like Talula's?",
    timestamp: "10:32 AM",
  },
  {
    id: "c3",
    senderId: "u1",
    text: "Yes! I've been dying to go there. The garden looks amazing.",
    timestamp: "10:33 AM",
  },
];

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500',
    'bg-pink-500', 
    'bg-purple-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-orange-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
