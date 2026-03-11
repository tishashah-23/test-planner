// Activities dataset — edit this file to add, remove, or update activities.
// Mirrors activities.json; used directly to avoid fetch() CORS issues on file://.

const ACTIVITIES = [

  // ── Bangkok ──────────────────────────────────────────────────────────────

  {
    id: "bkk-001", city: "Bangkok", area: "Rattanakosin",
    name: "Grand Palace & Wat Phra Kaew",
    description: "Thailand's most iconic royal complex housing the sacred Emerald Buddha",
    type: "Cultural", cost: "$$", duration: "3-4 hours", bestTime: "Morning",
    link: "https://www.royalgrandpalace.th/en/home"
  },
  {
    id: "bkk-002", city: "Bangkok", area: "Rattanakosin",
    name: "Wat Pho (Reclining Buddha)",
    description: "Ancient temple famous for its 46-metre gilded reclining Buddha and traditional massage school",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.watpho.com/en/"
  },
  {
    id: "bkk-003", city: "Bangkok", area: "Thonburi",
    name: "Wat Arun (Temple of Dawn)",
    description: "Stunning riverside temple covered in porcelain tiles, best experienced at sunrise or dusk",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Early Morning",
    link: "https://www.watarun.net/en/"
  },
  {
    id: "bkk-004", city: "Bangkok", area: "Chatuchak",
    name: "Chatuchak Weekend Market",
    description: "One of the world's largest markets with over 8,000 stalls selling everything imaginable",
    type: "Shopping", cost: "Free", duration: "3-4 hours", bestTime: "Morning",
    link: "https://www.chatuchakmarket.org/"
  },
  {
    id: "bkk-005", city: "Bangkok", area: "Yaowarat / Chinatown",
    name: "Chinatown (Yaowarat Road)",
    description: "Bangkok's vibrant Chinatown district packed with street food stalls and gold shops",
    type: "Food", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.tourismthailand.org/Attraction/yaowarat-road-chinatown"
  },
  {
    id: "bkk-006", city: "Bangkok", area: "Silom / Lumpini",
    name: "Lumphini Park",
    description: "Bangkok's central park — ideal for a morning jog, paddle boats, and watching monitor lizards",
    type: "Nature", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/lumphini-park"
  },
  {
    id: "bkk-007", city: "Bangkok", area: "Siam / Pathumwan",
    name: "Jim Thompson House Museum",
    description: "Preserved Thai silk merchant's home with a remarkable collection of Asian antiques",
    type: "Cultural", cost: "$$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.jimthompsonhouse.com/"
  },
  {
    id: "bkk-008", city: "Bangkok", area: "Rattanakosin",
    name: "Bangkok National Museum",
    description: "Southeast Asia's largest museum, covering Thai history from prehistoric times to the present",
    type: "Cultural", cost: "$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.finearts.go.th/bangkokmuseum"
  },
  {
    id: "bkk-009", city: "Bangkok", area: "Charoen Krung / Riverside",
    name: "Asiatique the Riverfront",
    description: "Open-air riverside night market combining boutique shopping with dining and entertainment",
    type: "Shopping", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.asiatiquethailand.com/"
  },
  {
    id: "bkk-010", city: "Bangkok", area: "Silom / Sathon",
    name: "Mahanakhon SkyWalk",
    description: "Thailand's highest rooftop observation deck featuring a glass-floored sky tray at 314m",
    type: "Adventure", cost: "$$$", duration: "1-2 hours", bestTime: "Sunset",
    link: "https://www.kingpowermahanakhon.co.th/"
  },
  {
    id: "bkk-011", city: "Bangkok", area: "Siam / Chidlom",
    name: "Erawan Shrine",
    description: "Revered Hindu shrine at a busy intersection, known for elaborate dance offerings",
    type: "Cultural", cost: "Free", duration: "Under 1 hour", bestTime: "Anytime",
    link: "https://www.tourismthailand.org/Attraction/erawan-shrine"
  },
  {
    id: "bkk-012", city: "Bangkok", area: "Rattanakosin",
    name: "Wat Saket (Golden Mount)",
    description: "Hilltop temple with 360-degree city views reached via a spiralling covered walkway",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/wat-saket-ratcha-wora-maha-wihan"
  },
  {
    id: "bkk-013", city: "Bangkok", area: "Rattanakosin",
    name: "Jay Fai Street Food Kitchen",
    description: "Michelin-starred street food stall serving legendary crab omelette and drunken noodles",
    type: "Food", cost: "$$$", duration: "1-2 hours", bestTime: "Evening",
    link: "https://www.tripadvisor.com/Restaurant_Review-g293916-d1010620-Reviews-Jay_Fai-Bangkok.html"
  },
  {
    id: "bkk-014", city: "Bangkok", area: "Rattanakosin",
    name: "Thip Samai Pad Thai",
    description: "Iconic old-school pad thai shop serving the city's most revered noodle dish since 1966",
    type: "Food", cost: "$", duration: "1-2 hours", bestTime: "Evening",
    link: "https://www.thipsamai.com/"
  },
  {
    id: "bkk-015", city: "Bangkok", area: "Ratchaburi (100km west)",
    name: "Damnoen Saduak Floating Market",
    description: "Traditional canal-side market where vendors sell produce and food from wooden boats",
    type: "Cultural", cost: "$", duration: "Half day", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/damnoen-saduak-floating-market"
  },
  {
    id: "bkk-016", city: "Bangkok", area: "Ratchada / Lat Phrao",
    name: "Talad Rot Fai (Train Night Market)",
    description: "Sprawling vintage night market with antiques, retro fashion, street food, and live music",
    type: "Shopping", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.taladrotfai.com/"
  },
  {
    id: "bkk-017", city: "Bangkok", area: "Chatuchak / Lat Phrao",
    name: "MOCA Bangkok",
    description: "Museum of Contemporary Art housing the largest private collection of Thai art in the world",
    type: "Cultural", cost: "$$", duration: "2-3 hours", bestTime: "Anytime",
    link: "https://mocabangkok.com/"
  },
  {
    id: "bkk-018", city: "Bangkok", area: "Phra Pradaeng (15km south)",
    name: "Bang Krachao (Green Lung)",
    description: "Urban jungle oasis across the river from the city, best explored by bicycle",
    type: "Nature", cost: "$", duration: "3-4 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/bang-krachao"
  },
  {
    id: "bkk-019", city: "Bangkok", area: "Chatuchak",
    name: "Or Tor Kor Fresh Market",
    description: "Bangkok's most upscale fresh market with premium produce, prepared foods, and local snacks",
    type: "Food", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/or-tor-kor-market"
  },
  {
    id: "bkk-020", city: "Bangkok", area: "Charoen Nakhon / Thonburi",
    name: "Lhong 1919 Riverside Complex",
    description: "Beautifully restored 19th-century trading port turned arts and dining destination",
    type: "Cultural", cost: "Free", duration: "1-2 hours", bestTime: "Afternoon",
    link: "https://www.lhong1919.com/"
  },
  {
    id: "bkk-021", city: "Bangkok", area: "Dusit",
    name: "Wat Benchamabophit (Marble Temple)",
    description: "Exquisite Carrara marble temple blending Italian and Thai architecture, most serene at sunrise",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/wat-benchamabophit-dusitwanaram"
  },
  {
    id: "bkk-022", city: "Bangkok", area: "Charoen Krung / Riverside",
    name: "Chao Phraya Dinner Cruise",
    description: "Scenic river dinner cruise past illuminated temples and the Bangkok skyline",
    type: "Food", cost: "$$$", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.chaophrayacruise.com/"
  },
  {
    id: "bkk-023", city: "Bangkok", area: "Taling Chan / West Bangkok",
    name: "Khlong Lat Mayom Floating Market",
    description: "Authentic local floating market on tree-lined canals, far less touristy than Damnoen Saduak",
    type: "Cultural", cost: "Free", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/khlong-lat-mayom-floating-market"
  },
  {
    id: "bkk-024", city: "Bangkok", area: "Pratunam / Ratchathewi",
    name: "Talad Neon Night Market",
    description: "Neon-lit night market in Pratunam with affordable street food, fashion, and accessories",
    type: "Shopping", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.facebook.com/taladneon/"
  },
  {
    id: "bkk-025", city: "Bangkok", area: "Siam / Phra Nakhon",
    name: "Siam Museum",
    description: "Interactive museum tracing Thai identity and culture through immersive multimedia exhibitions",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Anytime",
    link: "https://www.museumsiam.org/"
  },
  {
    id: "bkk-026", city: "Bangkok", area: "Banglamphu",
    name: "Khao San Road",
    description: "Bangkok's legendary backpacker street lined with bars, street food, souvenir shops, and live music",
    type: "Nightlife", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.tourismthailand.org/Attraction/khaosan-road"
  },
  {
    id: "bkk-027", city: "Bangkok", area: "Sukhumvit / Asok",
    name: "Benjakitti Forest Park",
    description: "Bangkok's newest and largest urban forest park with a 2km lake loop and a 5km elevated boardwalk through a planted forest",
    type: "Nature", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/benchakitti-park"
  },
  {
    id: "bkk-028", city: "Bangkok", area: "Nonthaburi (30km north)",
    name: "Ko Kret Island",
    description: "Car-free river island famous for Mon pottery workshops, ancient temples, and traditional Thai sweets",
    type: "Cultural", cost: "$", duration: "Half day", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/ko-kret"
  },
  {
    id: "bkk-029", city: "Bangkok", area: "Sukhumvit",
    name: "Sukhumvit Dining & Nightlife",
    description: "Bangkok's most dynamic strip for international restaurants, rooftop bars, and boutique shopping from Asok to Thong Lo",
    type: "Food", cost: "$$", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.tourismthailand.org/Attraction/sukhumvit-road"
  },
  {
    id: "bkk-030", city: "Bangkok", area: "Riverside / Chinatown",
    name: "Talad Noi",
    description: "Bangkok's oldest riverside quarter with colonial-era warehouses, street art murals, and specialty coffee shops",
    type: "Cultural", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/talat-noi"
  },

  // ── Chiang Mai ───────────────────────────────────────────────────────────

  {
    id: "cnx-001", city: "Chiang Mai", area: "Chom Thong (90km south)",
    name: "Doi Inthanon National Park",
    description: "Thailand's highest peak with twin royal pagodas, cloud forests, and stunning hill tribe villages",
    type: "Nature", cost: "$$", duration: "Full day", bestTime: "Morning",
    link: "https://www.dnp.go.th/parkreserve/asp/style1/default.asp?npid=6"
  },
  {
    id: "cnx-002", city: "Chiang Mai", area: "Mae Taeng (60km north)",
    name: "Elephant Nature Park",
    description: "Ethical rescue sanctuary where you can walk, feed, and bathe rescued elephants",
    type: "Adventure", cost: "$$$", duration: "Full day", bestTime: "Morning",
    link: "https://www.elephantnaturepark.org/"
  },
  {
    id: "cnx-003", city: "Chiang Mai", area: "Suthep Mountain",
    name: "Doi Suthep Temple",
    description: "Sacred mountaintop temple overlooking the city, accessible via 309 steps or funicular",
    type: "Cultural", cost: "$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.watphrathatdoisuthep.com/"
  },
  {
    id: "cnx-004", city: "Chiang Mai", area: "Chang Klan / East Moat",
    name: "Chiang Mai Night Bazaar",
    description: "Nightly street market in the city centre with handicrafts, street food, and live music",
    type: "Shopping", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.tourismthailand.org/Attraction/chiang-mai-night-bazaar"
  },
  {
    id: "cnx-005", city: "Chiang Mai", area: "Wualai / South Gate",
    name: "Sunday Walking Street (Wualai)",
    description: "Atmospheric night market on the ancient Wualai silversmith road every Sunday evening",
    type: "Shopping", cost: "Free", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.tourismthailand.org/Attraction/walking-street-wualai-road"
  },
  {
    id: "cnx-006", city: "Chiang Mai", area: "Old City / Moat",
    name: "Old City Temple Circuit",
    description: "Self-guided walk through Chiang Mai's ancient walled city visiting its most storied temples",
    type: "Cultural", cost: "$", duration: "3-4 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/chiang-mai-old-city"
  },
  {
    id: "cnx-007", city: "Chiang Mai", area: "San Patong / South",
    name: "Thai Farm Cooking School",
    description: "Half-day course starting with a local market visit, then cooking 5+ traditional Thai dishes",
    type: "Food", cost: "$$", duration: "Half day", bestTime: "Morning",
    link: "https://www.thaifarmcooking.net/"
  },
  {
    id: "cnx-008", city: "Chiang Mai", area: "Nimman / West Side",
    name: "Nimman District",
    description: "Chiang Mai's hippest neighbourhood with specialty coffee shops, galleries, and modern Thai cuisine",
    type: "Food", cost: "$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/nimmanhaemin-road"
  },
  {
    id: "cnx-009", city: "Chiang Mai", area: "Riverside / Chang Klan",
    name: "Ping River Sunset Cruise",
    description: "Relaxed boat tour along the Ping River at golden hour passing riverside temples and local life",
    type: "Nature", cost: "$$", duration: "1-2 hours", bestTime: "Evening",
    link: "https://www.tripadvisor.com/Attraction_Review-g293917-d14963060-Reviews-Ping_River_Cruise-Chiang_Mai.html"
  },
  {
    id: "cnx-010", city: "Chiang Mai", area: "Mae On / East (60km)",
    name: "Flight of the Gibbon Zipline",
    description: "Award-winning treetop zipline adventure through old-growth rainforest above Chiang Mai",
    type: "Adventure", cost: "$$$", duration: "Half day", bestTime: "Morning",
    link: "https://www.treetopasia.com/"
  },
  {
    id: "cnx-011", city: "Chiang Mai", area: "Old City / Moat",
    name: "Wat Chedi Luang",
    description: "Ruins of a 15th-century royal temple with a partially collapsed prang still standing 60 metres tall",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/wat-chedi-luang-worawihan"
  },
  {
    id: "cnx-012", city: "Chiang Mai", area: "Old City / Moat",
    name: "Wat Phra Singh",
    description: "Chiang Mai's most revered temple housing the Phra Singh Buddha image in Lanna-style grounds",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/wat-phra-sing-woramahawihan"
  },
  {
    id: "cnx-013", city: "Chiang Mai", area: "Chiang Rai (90km north)",
    name: "Baan Dam (Black House Museum)",
    description: "Striking collection of dark buildings housing antiques and animal materials by artist Thawan Duchanee",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Anytime",
    link: "https://www.baandam.org/"
  },
  {
    id: "cnx-014", city: "Chiang Mai", area: "Chiang Rai Province",
    name: "Chiang Rai Day Trip",
    description: "Day excursion to Chiang Rai visiting the surreal White Temple, Blue Temple, and Black House",
    type: "Day Trip", cost: "$$", duration: "Full day", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/chiang-rai"
  },
  {
    id: "cnx-015", city: "Chiang Mai", area: "Bo Sang (10km east)",
    name: "Bo Sang Umbrella Village",
    description: "Artisan village 9km east of the city where craftspeople hand-paint traditional parasols",
    type: "Cultural", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/ban-bo-sang"
  },
  {
    id: "cnx-016", city: "Chiang Mai", area: "San Kamphaeng (36km east)",
    name: "San Kamphaeng Hot Springs",
    description: "Natural geothermal springs in a forested park, perfect for soaking and boiling local eggs",
    type: "Wellness", cost: "$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/san-kamphaeng-hot-springs"
  },
  {
    id: "cnx-017", city: "Chiang Mai", area: "Old City / Various",
    name: "Muay Thai Training Session",
    description: "Professional Muay Thai training at a local gym, open to all levels from beginners upward",
    type: "Adventure", cost: "$$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Articles/sports-activities-in-chiang-mai"
  },
  {
    id: "cnx-018", city: "Chiang Mai", area: "Old City / Moat",
    name: "Old Medicine Hospital Massage",
    description: "Traditional Northern Thai massage at one of Thailand's most respected massage schools",
    type: "Wellness", cost: "$", duration: "1-2 hours", bestTime: "Anytime",
    link: "https://www.thaimassageschool.ac.th/"
  },
  {
    id: "cnx-019", city: "Chiang Mai", area: "Old City / Moat",
    name: "Chiang Mai Arts & Cultural Centre",
    description: "Beautifully restored colonial building tracing Chiang Mai's history from the Lanna Kingdom",
    type: "Cultural", cost: "$", duration: "1-2 hours", bestTime: "Anytime",
    link: "https://www.cmocity.com/"
  },
  {
    id: "cnx-020", city: "Chiang Mai", area: "Suthep Mountain",
    name: "Doi Pui Hmong Hill Tribe Village",
    description: "Authentic Hmong village on the slopes of Doi Suthep with traditional crafts and cultural exhibits",
    type: "Cultural", cost: "$", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/doi-pui-tribal-village"
  },
  {
    id: "cnx-021", city: "Chiang Mai", area: "Mae Hia / Southwest",
    name: "Chiang Mai Night Safari",
    description: "Open-air wildlife park with tram and walking safaris through nocturnal animal habitats",
    type: "Nature", cost: "$$", duration: "2-3 hours", bestTime: "Evening",
    link: "https://www.chiangmainightsafari.com/"
  },
  {
    id: "cnx-022", city: "Chiang Mai", area: "Mae On (30km east)",
    name: "Crazy Horse Buttress Rock Climbing",
    description: "Premier sport climbing destination outside the city with routes for all skill levels",
    type: "Adventure", cost: "$$", duration: "Half day", bestTime: "Morning",
    link: "https://www.crazyhorsebuttress.com/"
  },
  {
    id: "cnx-023", city: "Chiang Mai", area: "Old City / Moat",
    name: "Three Kings Monument",
    description: "Iconic bronze monument at the heart of the Old City depicting the three founders of Chiang Mai",
    type: "Cultural", cost: "Free", duration: "Under 1 hour", bestTime: "Anytime",
    link: "https://www.tourismthailand.org/Attraction/three-kings-monument"
  },
  {
    id: "cnx-024", city: "Chiang Mai", area: "Doi Saket (40km east)",
    name: "Doi Saket Hot Springs Day Spa",
    description: "Resort-style mineral hot spring complex with private pools and spa treatments",
    type: "Wellness", cost: "$$", duration: "Half day", bestTime: "Morning",
    link: "https://www.tripadvisor.com/Attraction_Review-g293917-d6519826-Reviews-Doi_Saket_Hot_Spring-Chiang_Mai.html"
  },
  {
    id: "cnx-025", city: "Chiang Mai", area: "Old City / Nimman",
    name: "Zabb E Lee Cooking Class",
    description: "Hands-on Northern Thai cooking class focusing on authentic Lanna recipes and local ingredients",
    type: "Food", cost: "$$", duration: "Half day", bestTime: "Morning",
    link: "https://www.tripadvisor.com/Attraction_Review-g293917-d6702578-Reviews-Zabb_E_Lee_Thai_Cooking_School-Chiang_Mai.html"
  },
  {
    id: "cnx-026", city: "Chiang Mai", area: "Mae Taeng (70km north)",
    name: "Sticky Waterfall (Nam Tok Bua Tong)",
    description: "Unique calcium-limestone waterfall whose surface grips bare feet — you can walk barefoot straight up it",
    type: "Nature", cost: "Free", duration: "Half day", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/nam-tok-bua-tong-sticky-waterfall"
  },
  {
    id: "cnx-027", city: "Chiang Mai", area: "Suthep / West Side",
    name: "Wat Umong Forest Temple",
    description: "Ancient 14th-century forest temple with dark meditation tunnels, crumbling frescoes, and resident monks",
    type: "Cultural", cost: "Free", duration: "1-2 hours", bestTime: "Morning",
    link: "https://www.watumong.org/"
  },
  {
    id: "cnx-028", city: "Chiang Mai", area: "Suthep Mountain",
    name: "Monk's Trail & Wat Pha Lat",
    description: "Forest hiking trail ascending Doi Suthep via a hidden jungle temple with mossy chedis and cascading streams",
    type: "Adventure", cost: "Free", duration: "2-3 hours", bestTime: "Morning",
    link: "https://www.tourismthailand.org/Attraction/wat-pha-lat"
  }
];
