// Bangladesh Divisions and Districts (all 64 districts)

export const DIVISIONS_EN: Record<string, string> = {
  barisal: "Barisal",
  chittagong: "Chittagong",
  dhaka: "Dhaka",
  khulna: "Khulna",
  rajshahi: "Rajshahi",
  rangpur: "Rangpur",
  sylhet: "Sylhet",
  mymenshing: "Mymensingh",
};

export const DIVISIONS_BN: Record<string, string> = {
  barisal: "বরিশাল",
  chittagong: "চট্টগ্রাম",
  dhaka: "ঢাকা",
  khulna: "খুলনা",
  rajshahi: "রাজশাহী",
  rangpur: "রংপুর",
  sylhet: "সিলেট",
  mymenshing: "ময়মনসিংহ",
};

export const DISTRICTS_BN: Record<string, string[]> = {
  barisal: ["বরিশাল", "ভোলা", "পটুয়াখালী", "পিরোজপুর", "বান্দারবান", "ঝালকাঠি"],
  chittagong: ["চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "নোয়াখালী", "ফেনী", "লক্ষ্মীপুর", "রাঙ্গামাটি", "বান্দারবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "হাইলা", "খাগড়াছড়ি", "মীরসারাই", "হবিগঞ্জ", "মৌলভীবাজার"],
  dhaka: ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "রাজবাড়ী", "মাদারীপুর", "শরীয়তপুর", "টাঙ্গাইল", "কিশোরগঞ্জ", "নেত্রকোণা", "ফরিদপুর"],
  khulna: ["খুলনা", "বাগেরহাট", "সাতক্ষীরা", "যশোর", "মাগুরা", "নড়াইল", "কুষ্টিয়া", "চুয়াডাঙ্গা", "মেহেরপুর"],
  rajshahi: ["রাজশাহী", "বগুড়া", "পাবনা", "সিরাজগঞ্জ", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ", "জয়পুরহাট"],
  rangpur: ["রংপুর", "দিনাজপুর", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারি", "ঠাকুরগাঁও", "পঞ্চগড়", "গাইবান্ধা"],
  sylhet: ["সিলেট", "হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ", "নেত্রকোণা", "কিশোরগঞ্জ"],
  mymenshing: ["ময়মনসিংহ", "শেরপুর", "জামালপুর", "নেত্রকোণা", "কিশোরগঞ্জ"],
};

export const DISTRICTS_EN: Record<string, string[]> = {
  barisal: ["Barisal", "Bhola", "Patuakhali", "Pirojpur", "Barguna", "Jhalokati"],
  chittagong: ["Chittagong", "Cox's Bazar", "Comilla", "Noakhali", "Feni", "Lakshmipur", "Rangamati", "Bandarban", "Brahmanbaria", "Chandpur", "Hathazari", "Khagrachhari", "Mirsharai", "Habiganj", "Moulvibazar"],
  dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Rajbari", "Madaripur", "Shariatpur", "Tangail", "Kishoreganj", "Netrakona", "Faridpur"],
  khulna: ["Khulna", "Bagerhat", "Satkhira", "Jessore", "Magura", "Narail", "Kushtia", "Chuadanga", "Meherpur"],
  rajshahi: ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Naogaon", "Chapainawabganj", "Joypurhat"],
  rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Lalmonirhat", "Nilphamari", "Thakurgaon", "Panchagarh", "Gaibandha"],
  sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj", "Netrakona", "Kishoreganj"],
  mymenshing: ["Mymensingh", "Sherpur", "Jamalpur", "Netrakona", "Kishoreganj"],
};

// Upazilla / Thana data keyed by district name
export const THANAS_EN: Record<string, string[]> = {
  "Dhaka": ["Dhanmondi", "Gulshan", "Banani", "Mirpur", "Uttara", "Motijheel", "Tejgaon", "Farmgate", "Mohammadpur", "Lalmatia", "Shahbagh", "Ramna", "Kotwali", "Lalbagh", "New Market", "Pallabi", "Badda", "Rampura", "Khilgaon", "Jatrabari", "Demra", "Cantonment"],
  "Gazipur": ["Gazipur Sadar", "Tongi", "Konabari", "Kaliakair", "Sreepur", "Kapasia"],
  "Narayanganj": ["Narayanganj Sadar", "Sonargaon", "Bandar", "Fatulla", "Araihazar", "Rupganj"],
  "Chittagong": ["Kotwali", "Pahartali", "Karnafully", "Hathazari", "Sandwip", "Mirsharai", "Sitakunda", "Banshkhali", "Patenga"],
  "Comilla": ["Comilla Sadar", "Daudkandi", "Monohorgonj", "Debidwar", "Barura", "Laksham", "Chandina", "Muradnagar"],
  "Cox's Bazar": ["Cox's Bazar Sadar", "Chakaria", "Teknaf", "Ukhia", "Ramu", "Maheshkhali", "Pekua"],
  "Sylhet": ["Kotwali", "Companiganj", "Golapganj", "Jakiganj", "Kanaighat", "Fenchuganj", "Bishwanath"],
  "Rajshahi": ["Boalia", "Motijheel", "Rajpara", "Puthia", "Durgapur", "Charghat", "Paba"],
  "Khulna": ["Khan Jahan Ali", "Khalishpur", "Sonadanga", "Daulatpur", "Batiaghata", "Dumuria", "Rupsa"],
  "Barisal": ["Kotwali", "Babuganj", "Bakerganj", "Mehendiganj", "Muladi"],
  "Rangpur": ["Rangpur Sadar", "Gangachara", "Taraganj", "Badarganj", "Kaunia", "Mithapukur"],
  "Mymensingh": ["Mymensingh Sadar", "Muktagachha", "Ishwarganj", "Nandail", "Gaffargaon", "Phulpur"],
  "Bogura": ["Bogura Sadar", "Sherpur", "Shibganj", "Nandigram", "Sonatala", "Gabtali", "Sariakandi"],
  "Jessore": ["Jessore Sadar", "Jhikargacha", "Monirampur", "Abhaynagar", "Bagha Para", "Keshabpur"],
  "Rangamati": ["Rangamati Sadar", "Baghaichhari", "Barkal", "Langadu", "Naniarchar"],
  "Habiganj": ["Habiganj Sadar", "Lakhai", "Chunarughat", "Nabiganj", "Bahubal"],
  "Tangail": ["Tangail Sadar", "Mirzapur", "Gopalpur", "Dhanbari", "Nagarpur", "Shakhimpur"],
};

export const THANAS_BN: Record<string, string[]> = {
  "ঢাকা": ["ধানমন্ডি", "গুলশান", "বনানী", "মিরপুর", "উত্তরা", "মতিঝিল", "তেজগাঁও", "ফার্মগেট", "মোহাম্মদপুর", "লালমাটিয়া", "শাহবাগ", "রমনা", "কোতোয়ালি", "লালবাগ", "নিউমার্কেট", "পল্লবী", "বাড্ডা", "রামপুরা", "খিলগাঁও", "যাত্রাবাড়ী", "দেমরা", "ক্যান্টনমেন্ট"],
  "গাজীপুর": ["গাজীপুর সদর", "টঙ্গী", "কোনাবাড়ী", "কালিয়াকৈর", "শ্রীপুর", "কাপাসিয়া"],
  "নারায়ণগঞ্জ": ["নারায়ণগঞ্জ সদর", "সোনারগাঁও", "বন্দর", "ফতুল্লা", "আড়াইহাজার", "রূপগঞ্জ"],
  "চট্টগ্রাম": ["কোতোয়ালি", "পাহারতলী", "কর্ণফুলী", "হাতহাজারী", "সান্দ্বীপ", "মীরসারাই", "সিতাকুণ্ড", "বাঁশখালী", "পতেঙ্গা"],
  "কুমিল্লা": ["কুমিল্লা সদর", "দাউদকান্দি", "মনোহরগঞ্জ", "দেবিদ্বার", "বরুড়া", "লাক্সাম", "চান্দিনা", "মুরাদনগর"],
  "কক্সবাজার": ["কক্সবাজার সদর", "চকরিয়া", "টেকনাফ", "উখিয়া", "রামু", "মহেশখালী", "পেকুয়া"],
  "সিলেট": ["কোতোয়ালি", "কোম্পানীগঞ্জ", "গোলাপগঞ্জ", "জকীগঞ্জ", "কানাইঘাট", "ফেঞ্চুগঞ্জ", "বিশ্বনাথ"],
  "রাজশাহী": ["বোয়ালিয়া", "মতিঝিল", "রাজপাড়া", "পুঠিয়া", "দুর্গাপুর", "চারঘাট", "পাবা"],
  "খুলনা": ["খান জাহান আলী", "খালিশপুর", "সোনাদানা", "দৌলতপুর", "বাটিয়াঘাটা", "দুমুরিয়া", "রূপসা"],
  "বরিশাল": ["কোতোয়ালি", "বাবুগঞ্জ", "বাকেরগঞ্জ", "মেহেন্দীগঞ্জ", "মুলাদী"],
  "রংপুর": ["রংপুর সদর", "গাঙ্গাচরা", "তারাগঞ্জ", "বাদারগঞ্জ", "কাউনিয়া", "মিঠাপুকুর"],
  "ময়মনসিংহ": ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ঈশ্বরগঞ্জ", "নন্দাইল", "গফরগাঁও", "ফুলপুর"],
  "বগুড়া": ["বগুড়া সদর", "শেরপুর", "শিবগঞ্জ", "নন্দিগ্রাম", "সোনাতলা", "গাবতলী", "সারিয়াকান্দি"],
  "যশোর": ["যশোর সদর", "ঝিকারগঞ্জ", "মণিরামপুর", "অভয়নগর", "বাঘা পাড়া", "কেশবপুর"],
  "রাঙ্গামাটি": ["রাঙ্গামাটি সদর", "বাঘাইছড়ি", "বরকল", "লাঙ্গাদু", "নানিয়ারচর"],
  "হবিগঞ্জ": ["হবিগঞ্জ সদর", "লাখাই", "চুনারুঘাট", "নবীগঞ্জ", "বাহুবল"],
  "টাঙ্গাইল": ["টাঙ্গাইল সদর", "মিরজাপুর", "গোপালপুর", "ধানবাড়ি", "নাগরপুর", "শাখিমপুর"],
};
