export type SupportedLanguage = 'te' | 'en' | 'ta' | 'hi' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
];

export function getPoshakuluTitleByLang(plates: number, lang: SupportedLanguage = 'te'): string {
  if (plates >= 222) {
    switch (lang) {
      case 'en': return 'Maharaja Poshakulu';
      case 'ta': return 'மகாராஜ போஷகர்கள்';
      case 'hi': return 'महाराज पोषक';
      case 'kn': return 'ಮಹಾರಾಜ ಪೋಷಕರು';
      default: return 'మహారాజ పోషకులు';
    }
  }
  if (plates >= 112) {
    switch (lang) {
      case 'en': return 'Raja Poshakulu';
      case 'ta': return 'ராஜ போஷகர்கள்';
      case 'hi': return 'राज पोषक';
      case 'kn': return 'ರಾಜ ಪೋಷಕರು';
      default: return 'రాజ పోషకులు';
    }
  }
  if (plates >= 52) {
    switch (lang) {
      case 'en': return 'Sahasraja Poshakulu';
      case 'ta': return 'சஹஸ்ராஜ போஷகர்கள்';
      case 'hi': return 'सहस्राज पोषक';
      case 'kn': return 'ಸಹಸ್ರರಾಜ ಪೋಷಕರು';
      default: return 'సహస్రాజ పోషకులు';
    }
  }
  switch (lang) {
    case 'en': return 'Poshakulu (Donor)';
    case 'ta': return 'போஷகர்கள்';
    case 'hi': return 'पोषक';
    case 'kn': return 'ಪೋಷಕರು';
    default: return 'పోషకులు';
  }
}

export const TRANSLATIONS = {
  te: {
    bannerPill: 'మహా అన్న ప్రసాద వితరణ సేవ - అరుణాచలం',
    bannerTitle: 'అరుణాచలం అన్నప్రసాద పోస్టర్',
    bannerSubtitle: 'అరుణాచలంలో జరిగే అన్న ప్రసాద వితరణ సేవలో మీ లేదా మీకు ఇష్టమైన వాళ్ల పేరు మీదుగా అన్న ప్రసాదాన్ని అందించవచ్చును',
    formTitle: 'అన్నప్రసాద వితరణ వివరాలు',
    formSubtitle: 'Fill in the details to sponsor Annaprasadam Seva at Arunachalam',
    nameLabel: '1. గౌరవ సంబోధన & దాత పేరు (Title & Full Name)',
    namePlaceholder: 'పేరు రాయండి (e.g. రమేష్ బాబు)',
    titles: [
      { id: 'శ్రీ', label: 'శ్రీ (Sri)' },
      { id: 'శ్రీమతి', label: 'శ్రీమతి (Srimathi)' }
    ],
    defaultTitle: 'శ్రీ',
    nameSuffix: 'గారికి',
    dobLabel: '2. జన్మదినం (Date of Birth / D.O.B)',
    dobHelp: '* ఈ జన్మదిన వివరాలు మీ అధికారిక విరాళ రశీదుపై నమోదు చేయబడతాయి.',
    dobRequired: 'దయచేసి పుట్టిన తేదీ నమోదు చేయండి (Date of Birth is required)',
    dobFuture: 'భవిష్యత్తు తేదీని నమోదు చేయకూడదు (Date cannot be in the future)',
    dobInvalid: 'దయచేసి సరైన తేదీ నమోదు చేయండి (Invalid date format)',
    platesLabel: '3. ఎన్ని ప్లేట్స్ అన్నప్రసాదం? (Number of Plates)',
    platesPlaceholder: '1 ప్లేట్ = ₹1 (ఉదా: 10, 20, 50, 100)',
    plateUnit: 'ప్లేట్లు',
    plateSingular: 'ప్లేట్',
    tierLabel: 'శ్రేణి:',
    paidPlatesLocked: '🔒 చెల్లింపు పూర్తయింది - ప్లేట్ల సంఖ్య లాక్ చేయబడింది',
    phoneLabel: '4. ఫోన్ నెంబర్ (Phone - ఐచ్ఛికం)',
    phonePlaceholder: '10 అంకెల మొబైల్ నెంబర్',
    locationLabel: '5. ప్రాంతం / నగరం (Location - ఐచ్ఛికం)',
    locationPlaceholder: 'ఉదా: హైదరాబాద్ / తిరువణ్ణామలై',
    photoLabel: '6. మీ ఫోటో ఎంపిక / అప్‌లోడ్ (Select / Upload Photo)',
    photoSelectedTitle: 'ఫోటో సిద్ధమైంది (Photo Selected)',
    photoSelectedSub: '✓ పోస్టర్‌పై లైవ్‌గా కనిపిస్తుంది',
    photoCropBtn: '✂️ క్రాప్',
    photoChangeBtn: 'మార్చండి',
    photoPrompt: 'పోస్టర్‌పై ముద్రించడానికి మీ లేదా దాత ఫోటోను ఎంచుకోండి:',
    photoGalleryBtn: '📁 గ్యాలరీ నుండి ఎంచుకోండి',
    photoCameraBtn: '📸 కెమెరాతో తీయండి',
    photoCaptureBtn: '📸 ఫోటో తీయండి',
    photoCancelBtn: 'రద్దు చేయండి',
    paymentHeading: 'అన్నప్రసాద విరాళం చెల్లింపు (Online Payment)',
    paymentInNameOf: 'గారి పేరున',
    platesSummaryLabel: 'అన్నప్రసాదం ప్లేట్లు:',
    assignedPlateSummaryLabel: 'కేటాయించిన ప్లేట్ నంబర్:',
    totalAmountLabel: 'మొత్తం విరాళం (Total Amount):',
    payButton: '💳 ఆన్‌లైన్‌లో చెల్లించండి',
    connectingGateway: 'చెల్లింపు గేట్‌వే సిద్ధమవుతోంది... (Connecting...)',
    paymentSuccess: 'చెల్లింపు పూర్తయింది (Payment Successful)',
    paymentSuccessSub: 'మీ పేరు, ప్లేట్స్ వివరాలతో పోస్టర్ మరియు అధికారిక రశీదు సిద్ధమయ్యాయి!',
    viewReceiptBtn: '🧾 అధికారిక విరాళ రశీదు చూడండి (View Receipt)',
    securityNotice: '🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking',
    fillRequiredPrompt: 'ℹ️ దాత పేరు మరియు ప్లేట్స్ సంఖ్య నమోదు చేసిన తర్వాత పేమెంట్ ఆప్షన్ కనిపిస్తుంది.',
    posterTab: '🖼️ అన్నప్రసాద పోస్టర్ (Poster)',
    receiptTab: '🧾 విరాళ రశీదు (Receipt)',
    line1Text: 'ప్లేట్స్ అన్నప్రసాదం',
    line2Text: 'అందిస్తున్నందుకు',
    shareWhatsApp: 'వాట్సాప్‌లో షేర్ చేయండి (Share to WhatsApp)'
  },
  en: {
    bannerPill: 'Maha Annaprasadam Seva - Arunachalam',
    bannerTitle: 'Arunachalam Annaprasadam Poster',
    bannerSubtitle: 'Sponsor holy Annaprasadam at Arunachalam in your name or in honor of your beloved family & friends',
    formTitle: 'Annaprasadam Seva Details',
    formSubtitle: 'Fill in the details to sponsor Annaprasadam Seva at Arunachalam',
    nameLabel: '1. Title & Full Name *',
    namePlaceholder: 'Enter full name (e.g. Ramesh Babu)',
    titles: [
      { id: 'Sri', label: 'Sri (Mr)' },
      { id: 'Smt', label: 'Smt (Mrs)' }
    ],
    defaultTitle: 'Sri',
    nameSuffix: '',
    dobLabel: '2. Date of Birth (D.O.B) *',
    dobHelp: '* This Date of Birth will be officially printed on your 80G donation receipt.',
    dobRequired: 'Please enter Date of Birth',
    dobFuture: 'Date of Birth cannot be in the future',
    dobInvalid: 'Please enter a valid Date of Birth',
    platesLabel: '3. Number of Plates *',
    platesPlaceholder: '1 Plate = ₹1 (e.g. 10, 20, 50, 100)',
    plateUnit: 'Plates',
    plateSingular: 'Plate',
    tierLabel: 'Tier:',
    paidPlatesLocked: '🔒 Paid & Permanently Locked',
    phoneLabel: '4. Phone Number (Optional)',
    phonePlaceholder: '10-digit mobile number',
    locationLabel: '5. City / Location (Optional)',
    locationPlaceholder: 'e.g. Hyderabad / Tiruvannamalai',
    photoLabel: '6. Photo Selection / Upload',
    photoSelectedTitle: 'Photo Selected',
    photoSelectedSub: '✓ Live preview active on poster',
    photoCropBtn: '✂️ Crop',
    photoChangeBtn: 'Change',
    photoPrompt: 'Select a photo of the donor or devotee to display on the poster:',
    photoGalleryBtn: '📁 Choose from Gallery',
    photoCameraBtn: '📸 Take from Camera',
    photoCaptureBtn: '📸 Capture Photo',
    photoCancelBtn: 'Cancel',
    paymentHeading: 'Online Payment (Annaprasadam Donation)',
    paymentInNameOf: 'In the name of',
    platesSummaryLabel: 'Plates Sponsoring:',
    assignedPlateSummaryLabel: 'Assigned Plate Number:',
    totalAmountLabel: 'Total Donation Amount:',
    payButton: '💳 Pay Online Now',
    connectingGateway: 'Connecting to Payment Gateway...',
    paymentSuccess: 'Payment Successful',
    paymentSuccessSub: 'Your official donation receipt and personalized Annaprasadam poster are ready!',
    viewReceiptBtn: '🧾 View Official Donation Receipt',
    securityNotice: '🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking',
    fillRequiredPrompt: 'ℹ️ Please enter donor name and plate count to proceed to payment.',
    posterTab: '🖼️ Annaprasadam Poster',
    receiptTab: '🧾 Donation Receipt',
    line1Text: 'Plates Annaprasadam',
    line2Text: 'Offering with Devotion',
    shareWhatsApp: 'Share to WhatsApp'
  },
  ta: {
    bannerPill: 'மகா அன்னபிரசாத விநியோக சேவை - அருணாச்சலம்',
    bannerTitle: 'அருணாச்சலம் அன்னபிரசாத போஸ்டர்',
    bannerSubtitle: 'அருணாச்சலத்தில் நடைபெறும் அன்னபிரசாத சேவையில் உங்கள் அல்லது உங்கள் அன்புக்குரியவர்களின் பெயரில் பிரசாதம் வழங்கி அருள்பெறுங்கள்',
    formTitle: 'அன்னபிரசாத விநியோக விவரங்கள்',
    formSubtitle: 'அருணாச்சலம் அன்னபிரசாத சேவையில் பங்கேற்க விவரங்களை நிரப்பவும்',
    nameLabel: '1. அடைமொழி & கொடையாளர் பெயர் *',
    namePlaceholder: 'முழு பெயரை எழுதவும் (எ.கா: ரமேஷ் பாபு)',
    titles: [
      { id: 'ஸ்ரீ', label: 'ஸ்ரீ (Sri)' },
      { id: 'ஸ்ரீமதி', label: 'ஸ்ரீமதி (Smt)' }
    ],
    defaultTitle: 'ஸ்ரீ',
    nameSuffix: 'அவர்களுக்கு',
    dobLabel: '2. பிறந்த தேதி (Date of Birth / D.O.B) *',
    dobHelp: '* இந்த பிறந்த தேதி உங்கள் அதிகாரப்பூர்வ நன்கொடை ரசீதில் பதிவு செய்யப்படும்.',
    dobRequired: 'தயவுசெய்து பிறந்த தேதியை உள்ளிடவும்',
    dobFuture: 'எதிர்கால தேதியை உள்ளிட முடியாது',
    dobInvalid: 'சரியான பிறந்த தேதியை உள்ளிடவும்',
    platesLabel: '3. எத்தனை தட்டுகள் அன்னபிரசாதம்? *',
    platesPlaceholder: '1 தட்டு = ₹1 (எ.கா: 10, 20, 50, 100)',
    plateUnit: 'தட்டுகள்',
    plateSingular: 'தட்டு',
    tierLabel: 'பிரிவு:',
    paidPlatesLocked: '🔒 கட்டணம் செலுத்தப்பட்டது - தட்டுகள் எண்ணிக்கை பூட்டப்பட்டது',
    phoneLabel: '4. தொலைபேசி எண் (விருப்பத்தேர்வு)',
    phonePlaceholder: '10 இலக்க மொபைல் எண்',
    locationLabel: '5. ஊர் / நகரம் (விருப்பத்தேர்வு)',
    locationPlaceholder: 'எ.கா: சென்னை / திருவண்ணாமலை',
    photoLabel: '6. புகைப்பட தேர்வு / பதிவேற்றம்',
    photoSelectedTitle: 'புகைப்படம் தேர்ந்தெடுக்கப்பட்டது',
    photoSelectedSub: '✓ போஸ்டரில் உடனடியாகக் காட்டப்படுகிறது',
    photoCropBtn: '✂️ பயிர் (Crop)',
    photoChangeBtn: 'மாற்றவும்',
    photoPrompt: 'போஸ்டரில் காண்பிக்க கொடையாளரின் புகைப்படத்தை தேர்வு செய்யவும்:',
    photoGalleryBtn: '📁 கேலரியிலிருந்து தேர்வு செய்க',
    photoCameraBtn: '📸 கேமராவில் எடுக்கவும்',
    photoCaptureBtn: '📸 புகைப்படம் எடுக்கவும்',
    photoCancelBtn: 'ரத்து செய்',
    paymentHeading: 'அன்னபிரசாத நன்கொடை செலுத்துதல் (Online Payment)',
    paymentInNameOf: 'அவர்களின் பெயரில்',
    platesSummaryLabel: 'அன்னபிரசாத தட்டுகள்:',
    assignedPlateSummaryLabel: 'ஒதுக்கப்பட்ட தட்டு எண்:',
    totalAmountLabel: 'மொத்த நன்கொடை தொகை:',
    payButton: '💳 ஆன்லைனில் செலுத்தவும்',
    connectingGateway: 'கட்டண தளம் இணைகிறது...',
    paymentSuccess: 'கட்டணம் வெற்றிகரமாக முடிந்தது',
    paymentSuccessSub: 'உங்கள் அதிகாரப்பூர்வ நன்கொடை ரசீது மற்றும் அன்னபிரசாத போஸ்டர் தயாராக உள்ளது!',
    viewReceiptBtn: '🧾 அதிகாரப்பூர்வ நன்கொடை ரசீதை பார்க்கவும்',
    securityNotice: '🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking',
    fillRequiredPrompt: 'ℹ️ கட்டணம் செலுத்த பெயர் மற்றும் தட்டுகளின் எண்ணிக்கையை உள்ளிடவும்.',
    posterTab: '🖼️ அன்னபிரசாத போஸ்டர்',
    receiptTab: '🧾 நன்கொடை ரசீது',
    line1Text: 'தட்டுகள் அன்னபிரசாதம்',
    line2Text: 'பக்தியுடன் வழங்குவதற்கு',
    shareWhatsApp: 'வாட்ஸ்அப்பில் பகிரவும் (Share to WhatsApp)'
  },
  hi: {
    bannerPill: 'महा अन्नप्रसाद वितरण सेवा - अरुणाचलम',
    bannerTitle: 'अरुणाचलम अन्नप्रसाद पोस्टर',
    bannerSubtitle: 'अरुणाचलम में आयोजित महा अन्नप्रसाद वितरण सेवा में अपने या अपने प्रियजनों के नाम पर अन्नप्रसाद अर्पित करें',
    formTitle: 'अन्नप्रसाद वितरण विवरण',
    formSubtitle: 'अरुणाचलम में अन्नप्रसाद सेवा प्रायोजित करने हेतु विवरण भरें',
    nameLabel: '1. आदर सूचक व दानदाता का पूरा नाम *',
    namePlaceholder: 'पूरा नाम लिखें (उदा: रमेश बाबू)',
    titles: [
      { id: 'श्री', label: 'श्री (Sri)' },
      { id: 'श्रीमती', label: 'श्रीमती (Smt)' }
    ],
    defaultTitle: 'श्री',
    nameSuffix: 'जी को',
    dobLabel: '2. जन्म तिथि (Date of Birth / D.O.B) *',
    dobHelp: '* यह जन्म तिथि आपकी आधिकारिक दान रसीद पर दर्ज की जाएगी।',
    dobRequired: 'कृपया जन्म तिथि दर्ज करें',
    dobFuture: 'जन्म तिथि भविष्य की नहीं हो सकती',
    dobInvalid: 'कृपया सही जन्म तिथि दर्ज करें',
    platesLabel: '3. कितने प्लेट अन्नप्रसाद? *',
    platesPlaceholder: '1 प्लेट = ₹1 (उदा: 10, 20, 50, 100)',
    plateUnit: 'प्लेट',
    plateSingular: 'प्लेट',
    tierLabel: 'श्रेणी:',
    paidPlatesLocked: '🔒 भुगतान सफल - प्लेटों की संख्या लॉक कर दी गई है',
    phoneLabel: '4. फोन नंबर (वैकल्पिक)',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    locationLabel: '5. शहर / स्थान (वैकल्पिक)',
    locationPlaceholder: 'उदा: हैदराबाद / तिरुवन्नामलाई',
    photoLabel: '6. फोटो चयन / अपलोड',
    photoSelectedTitle: 'फोटो तैयार है',
    photoSelectedSub: '✓ पोस्टर पर लाइव दिखाई दे रहा है',
    photoCropBtn: '✂️ क्रॉप',
    photoChangeBtn: 'बदलें',
    photoPrompt: 'पोस्टर पर लगाने के लिए अपनी या दानदाता की फोटो चुनें:',
    photoGalleryBtn: '📁 गैलरी से चुनें',
    photoCameraBtn: '📸 कैमरे से फोटो लें',
    photoCaptureBtn: '📸 फोटो खींचें',
    photoCancelBtn: 'रद्द करें',
    paymentHeading: 'अन्नप्रसाद दान ऑनलाइन भुगतान (Online Payment)',
    paymentInNameOf: 'के नाम पर',
    platesSummaryLabel: 'अन्नप्रसाद प्लेटें:',
    assignedPlateSummaryLabel: 'आवंटित प्लेट नंबर:',
    totalAmountLabel: 'कुल दान राशि:',
    payButton: '💳 ऑनलाइन भुगतान करें',
    connectingGateway: 'भुगतान गेटवे से जुड़ रहा है...',
    paymentSuccess: 'भुगतान सफल रहा (Payment Successful)',
    paymentSuccessSub: 'आपकी आधिकारिक दान रसीद और अन्नप्रसाद पोस्टर तैयार है!',
    viewReceiptBtn: '🧾 आधिकारिक दान रसीद देखें (View Receipt)',
    securityNotice: '🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking',
    fillRequiredPrompt: 'ℹ️ भुगतान के लिए कृपया नाम और प्लेटों की संख्या दर्ज करें।',
    posterTab: '🖼️ अन्नप्रसाद पोस्टर',
    receiptTab: '🧾 दान रसीद',
    line1Text: 'प्लेट अन्नप्रसाद',
    line2Text: 'भक्तिपूर्वक अर्पित करने हेतु',
    shareWhatsApp: 'व्हाट्सएप पर शेयर करें (Share to WhatsApp)'
  },
  kn: {
    bannerPill: 'ಮಹಾ ಅನ್ನಪ್ರಸಾದ ವಿತರಣಾ ಸೇವೆ - ಅರುಣಾಚಲ',
    bannerTitle: 'ಅರುಣಾಚಲ ಅನ್ನಪ್ರಸಾದ ಪೋಸ್ಟರ್',
    bannerSubtitle: 'ಅರುಣಾಚಲದಲ್ಲಿ ನಡೆಯುವ ಅನ್ನಪ್ರಸಾದ ಸೇವೆಯಲ್ಲಿ ನಿಮ್ಮ ಅಥವಾ ನಿಮ್ಮ ಪ್ರೀತಿಪಾತ್ರರ ಹೆಸರಿನಲ್ಲಿ ಅನ್ನಪ್ರಸಾದವನ್ನು ಅರ್ಪಿಸಿ ಪುನೀತರಾಗಿ',
    formTitle: 'ಅನ್ನಪ್ರಸಾದ ವಿತರಣಾ ವಿವರಗಳು',
    formSubtitle: 'ಅರುಣಾಚಲ ಅನ್ನಪ್ರಸಾದ ಸೇವೆಯಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಲು ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ',
    nameLabel: '1. ಗೌರವ ಸಂಬೋಧನೆ ಮತ್ತು ದಾನಿಗಳ ಹೆಸರು (Title & Full Name) *',
    namePlaceholder: 'ಪೂರ್ಣ ಹೆಸರು ಬರೆಯಿರಿ (ಉದಾ: ರಮೇಶ್ ಬಾಬು)',
    titles: [
      { id: 'ಶ್ರೀ', label: 'ಶ್ರೀ (Sri)' },
      { id: 'ಶ್ರೀಮತಿ', label: 'ಶ್ರೀಮತಿ (Srimathi)' }
    ],
    defaultTitle: 'ಶ್ರೀ',
    nameSuffix: 'ರವರಿಗೆ',
    dobLabel: '2. ಹುಟ್ಟಿದ ದಿನಾಂಕ (Date of Birth / D.O.B) *',
    dobHelp: '* ಈ ಜನ್ಮ ದಿನಾಂಕವನ್ನು ನಿಮ್ಮ ಅಧಿಕೃತ ದೇಣಿಗೆ ರಸೀದಿಯಲ್ಲಿ ಮುದ್ರಿಸಲಾಗುತ್ತದೆ.',
    dobRequired: 'ದಯವಿಟ್ಟು ಹುಟ್ಟಿದ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ',
    dobFuture: 'ಭವಿಷ್ಯದ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಲಾಗುವುದಿಲ್ಲ',
    dobInvalid: 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ',
    platesLabel: '3. ಎಷ್ಟು ಪ್ಲೇಟ್ ಅನ್ನಪ್ರಸಾದ? (Number of Plates) *',
    platesPlaceholder: '1 ಪ್ಲೇಟ್ = ₹1 (ಉದಾ: 10, 20, 50, 100)',
    plateUnit: 'ಪ್ಲೇಟ್‌ಗಳು',
    plateSingular: 'ಪ್ಲೇಟ್',
    tierLabel: 'ಶ್ರೇಣಿ:',
    paidPlatesLocked: '🔒 ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ - ಪ್ಲೇಟ್‌ಗಳ ಸಂಖ್ಯೆಯನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ',
    phoneLabel: '4. ಫೋನ್ ಸಂಖ್ಯೆ (Phone - ಐಚ್ಛಿಕ)',
    phonePlaceholder: '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    locationLabel: '5. ಊರು / ನಗರ (Location - ಐಚ್ಛಿಕ)',
    locationPlaceholder: 'ಉದಾ: ಬೆಂಗಳೂರು / ತಿರುವಣ್ಣಾಮಲೈ',
    photoLabel: '6. ನಿಮ್ಮ ಫೋಟೋ ಆಯ್ಕೆ / ಅಪ್‌ಲೋಡ್ (Select / Upload Photo)',
    photoSelectedTitle: 'ಫೋಟೋ ಸಿದ್ಧವಾಗಿದೆ (Photo Selected)',
    photoSelectedSub: '✓ ಪೋಸ್ಟರ್‌ನಲ್ಲಿ ಲೈವ್ ಆಗಿ ಕಾಣಿಸುತ್ತದೆ',
    photoCropBtn: '✂️ ಕ್ರಾಪ್',
    photoChangeBtn: 'ಬದಲಾಯಿಸಿ',
    photoPrompt: 'ಪೋಸ್ಟರ್‌ನಲ್ಲಿ ಮುದ್ರಿಸಲು ನಿಮ್ಮ ಅಥವಾ ದಾನಿಗಳ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ:',
    photoGalleryBtn: '📁 ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
    photoCameraBtn: '📸 ಕ್ಯಾಮೆರಾದಿಂದ ತೆಗೆಯಿರಿ',
    photoCaptureBtn: '📸 ಫೋಟೋ ತೆಗೆಯಿರಿ',
    photoCancelBtn: 'ರದ್ದುಮಾಡಿ',
    paymentHeading: 'ಅನ್ನಪ್ರಸಾದ ದೇಣಿಗೆ ಆನ್‌ಲೈನ್ ಪಾವತಿ (Online Payment)',
    paymentInNameOf: 'ರವರ ಹೆಸರಿನಲ್ಲಿ',
    platesSummaryLabel: 'ಅನ್ನಪ್ರಸಾದ ಪ್ಲೇಟ್‌ಗಳು:',
    assignedPlateSummaryLabel: 'ನಿಯೋಜಿಸಲಾದ ಪ್ಲೇಟ್ ಸಂಖ್ಯೆ:',
    totalAmountLabel: 'ಒಟ್ಟು ದೇಣಿಗೆ ಮೊತ್ತ (Total Amount):',
    payButton: '💳 ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ',
    connectingGateway: 'ಪಾವತಿ ಗೇಟ್‌ವೇ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...',
    paymentSuccess: 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ (Payment Successful)',
    paymentSuccessSub: 'ನಿಮ್ಮ ಅಧಿಕೃತ ದೇಣಿಗೆ ರಸೀದಿ ಮತ್ತು ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಅನ್ನಪ್ರಸಾದ ಪೋಸ್ಟರ್ ಸಿದ್ಧವಾಗಿದೆ!',
    viewReceiptBtn: '🧾 ಅಧಿಕೃತ ದೇಣಿಗೆ ರಸೀದಿ ವೀಕ್ಷಿಸಿ (View Receipt)',
    securityNotice: '🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking',
    fillRequiredPrompt: 'ℹ️ ಪಾವತಿಸಲು ದಯವಿಟ್ಟು ಹೆಸರು ಮತ್ತು ಪ್ಲೇಟ್‌ಗಳ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.',
    posterTab: '🖼️ ಅನ್ನಪ್ರಸಾದ ಪೋಸ್ಟರ್ (Poster)',
    receiptTab: '🧾 ದೇಣಿಗೆ ರಸೀದಿ (Receipt)',
    line1Text: 'ಪ್ಲೇಟ್ ಅನ್ನಪ್ರಸಾದ',
    line2Text: 'ಭಕ್ತಿಯಿಂದ ಸಮರ್ಪಿಸುತ್ತಿರುವುದಕ್ಕೆ',
    shareWhatsApp: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ (Share to WhatsApp)'
  }
};
