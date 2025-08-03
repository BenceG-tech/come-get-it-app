import { Venue } from "@/types/venue";

export const venues: Venue[] = [
  {
    id: "1",
    name: "Café Memories",
    description: "A vibrant cocktail bar with live music and a late-night atmosphere. Perfect for those looking to enjoy craft cocktails and energetic vibes.",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
    address: "Király utca 15, Budapest 1075",
    latitude: 47.498,
    longitude: 19.056,
    tags: ["Café", "Coffee", "Budapest"],
    category: "Café",
    isOpen: true,
    phone: "+36 1 555 1234",
    website: "https://example.com/cafememories",
    priceLevel: "$$",
    location: {
      city: "Budapest",
      distance: "0.3"
    },
    freeDrink: {
      name: "Johnnie Walker & Lemonade",
      description: "A refreshing blend of premium Johnnie Walker Black Label whisky with fresh lemonade, served over ice with a lemon garnish. Perfect for those who enjoy a smooth, balanced drink with a citrus twist.",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Johnnie Walker Black Label whisky (40% alkoholtartalom), Lemonade, Lemon Garnish, Served Over Ice"
    },
    offers: [
      {
        title: "Free Drink",
        description: "Show this offer to receive a free welcome shot with any cocktail purchase"
      },
      {
        title: "Happy Hour Special",
        description: "50% off all cocktails between 6-8 PM every weekday"
      }
    ]
  },
  {
    id: "2",
    name: "Essence Delicates",
    description: "The original ruin bar in Budapest, offering a unique atmosphere with eclectic decor, multiple bars, and a vibrant cultural scene.",
    image: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1829&q=80",
    address: "Kazinczy utca 14, Budapest 1075",
    latitude: 47.497,
    longitude: 19.059,
    tags: ["Bistro", "Fine Dining", "Budapest"],
    category: "Bistro",
    isOpen: true,
    phone: "+36 1 555 5678",
    website: "https://example.com/essencedelicates",
    priceLevel: "$$",
    location: {
      city: "Budapest",
      distance: "0.5"
    },
    freeDrink: {
      name: "Craft Beer Selection",
      description: "Choose from our selection of premium Hungarian craft beers, perfectly paired with our artisanal dishes.",
      image: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Premium Hungarian craft beer, served chilled"
    },
    offers: [
      {
        title: "Free Drink",
        description: "Get a free craft beer with any food purchase over 3000 Ft"
      }
    ]
  },
  {
    id: "3",
    name: "Urban Spirits",
    description: "Elegant rooftop bar offering panoramic views of Budapest, sophisticated cocktails, and a refined atmosphere.",
    image: "https://images.unsplash.com/photo-1517940310602-26535839fe84?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    address: "Hercegprímás utca 5, Budapest 1051",
    latitude: 47.501,
    longitude: 19.048,
    tags: ["Rooftop", "Cocktail Bar", "Date Night"],
    category: "Rooftop Bar",
    isOpen: true,
    phone: "+36 1 555 9012",
    website: "https://example.com/urbanspirits",
    priceLevel: "$$$",
    location: {
      city: "Budapest",
      distance: "0.7"
    },
    freeDrink: {
      name: "Signature Rooftop Cocktail",
      description: "Our house special cocktail with premium spirits and fresh ingredients, served with a panoramic view of Budapest.",
      image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80",
      ingredients: "Premium vodka, fresh lime juice, elderflower liqueur, garnished with mint"
    },
    offers: [
      {
        title: "Free Drink",
        description: "Complimentary welcome drink with reservation"
      }
    ]
  },
  {
    id: "4",
    name: "Doblo Wine Bar",
    description: "Cozy wine bar in the Jewish Quarter offering an extensive selection of Hungarian wines and charcuterie plates.",
    image: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    address: "Dob utca 20, Budapest 1072",
    latitude: 47.499,
    longitude: 19.060,
    tags: ["Wine", "Small Plates", "Date Night"],
    category: "Wine Bar",
    isOpen: false,
    phone: "+36 1 555 3456",
    website: "https://example.com/doblo",
    priceLevel: "$$",
    location: {
      city: "Budapest",
      distance: "0.4"
    },
    freeDrink: {
      name: "Hungarian Wine Selection",
      description: "A glass of our finest Hungarian wine, carefully selected from local vineyards.",
      image: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Premium Hungarian red or white wine, served at optimal temperature"
    },
    offers: [
      {
        title: "Wine Tasting Special",
        description: "Try 5 premium Hungarian wines for the price of 3"
      }
    ]
  },
  {
    id: "5",
    name: "Boutiq Bar",
    description: "Award-winning cocktail bar known for innovative mixology and a sophisticated atmosphere.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80",
    address: "Paulay Ede utca 5, Budapest 1061",
    latitude: 47.502,
    longitude: 19.055,
    tags: ["Killer Cocktails", "Date Night", "Female Owned"],
    category: "Cocktail Bar",
    isOpen: true,
    phone: "+36 1 555 7890",
    website: "https://example.com/boutiqbar",
    priceLevel: "$$$",
    location: {
      city: "Budapest",
      distance: "0.6"
    },
    freeDrink: {
      name: "Boutiq Signature Martini",
      description: "Our award-winning signature martini crafted with premium gin and house-made vermouth.",
      image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80",
      ingredients: "Premium gin, house-made dry vermouth, olive garnish"
    },
    offers: [
      {
        title: "Free Drink",
        description: "Complimentary signature cocktail when you spend over 10000 Ft"
      }
    ]
  },
  {
    id: "6",
    name: "Élesztő Craft Beer Garden",
    description: "Spacious beer garden housed in a former glassworks factory, featuring over 20 Hungarian craft beers on tap.",
    image: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    address: "Tűzoltó utca 22, Budapest 1094",
    latitude: 47.483,
    longitude: 19.069,
    tags: ["Craft Beer", "Pub Garden", "Dog-Friendly"],
    category: "Beer Garden",
    isOpen: true,
    phone: "+36 1 555 2345",
    website: "https://example.com/eleszto",
    priceLevel: "$",
    location: {
      city: "Budapest",
      distance: "1.2"
    },
    freeDrink: {
      name: "Craft Beer Flight",
      description: "Sample three of our finest Hungarian craft beers in a tasting flight.",
      image: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Three 150ml samples of premium Hungarian craft beers"
    },
    offers: []
  },
  {
    id: "7",
    name: "Mazel Tov",
    description: "Middle Eastern restaurant and bar in a beautiful indoor garden setting, offering a relaxed atmosphere and cultural events.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1774&q=80",
    address: "Akácfa utca 47, Budapest 1072",
    latitude: 47.498,
    longitude: 19.063,
    tags: ["Foodie Spots", "Pub Garden", "Groups"],
    category: "Restaurant & Bar",
    isOpen: false,
    phone: "+36 1 555 6789",
    website: "https://example.com/mazeltov",
    priceLevel: "$$",
    location: {
      city: "Budapest",
      distance: "0.8"
    },
    freeDrink: {
      name: "House Wine",
      description: "A glass of our carefully selected house wine, perfect to complement our Middle Eastern cuisine.",
      image: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Premium house red or white wine, served at optimal temperature"
    },
    offers: [
      {
        title: "Free Drink",
        description: "Complimentary house wine with any main course"
      }
    ]
  },
  {
    id: "8",
    name: "Warmup Bar",
    description: "Trendy pre-game spot with affordable drinks and a lively atmosphere, perfect for starting your night out.",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
    address: "Nagymező utca 44, Budapest 1065",
    latitude: 47.505,
    longitude: 19.057,
    tags: ["Student-friendly", "Pub", "Groups"],
    category: "Pub",
    isOpen: true,
    phone: "+36 1 555 0123",
    website: "https://example.com/warmupbar",
    priceLevel: "$",
    location: {
      city: "Budapest",
      distance: "0.9"
    },
    freeDrink: {
      name: "Student Special Beer",
      description: "A refreshing beer perfect for students and young professionals looking to start their night.",
      image: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      ingredients: "Premium lager beer, served ice cold"
    },
    offers: [
      {
        title: "Student Special",
        description: "Show your student ID for 20% off all drinks"
      }
    ]
  }
];