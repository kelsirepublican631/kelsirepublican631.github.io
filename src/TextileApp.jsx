import React, { useState, useMemo, useRef, useEffect, createContext, useContext } from "react";
import { Search, Plus, X, Package, Store, ShieldCheck, ChevronRight, Layers, Ruler, Droplets, Trash2, Pencil, Camera, Pipette, Sparkles, Upload, MapPin, Building2, Clock, Check, XCircle, Globe, ShoppingCart, Phone, MessageCircle, Loader2, Wifi, WifiOff, ArrowLeft, TrendingUp } from "lucide-react";
import * as api from "./lib/api";
import * as marketOutbox from "./lib/marketOutbox";
import { buildInsightFacts } from "./lib/insightFacts";

// ---------------------------------------------------------------------------
// LANGUAGE / i18n — English (default), Pashto, Dari. Pashto and Dari are
// right-to-left scripts, so switching also flips text direction and swaps
// in a font stack that renders Perso-Arabic script properly.
// ---------------------------------------------------------------------------

const LANGUAGES = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  ps: { label: "Pashto", nativeLabel: "پښتو", dir: "rtl" },
  fa: { label: "Dari", nativeLabel: "دری", dir: "rtl" },
};

const STRINGS = {
  // Nav
  brand: { en: "The Swatch Book", ps: "د نمونو کتاب", fa: "کتاب نمونه‌ها" },
  navStorefront: { en: "Storefront", ps: "پلورنځی", fa: "فروشگاه" },
  navMatcher: { en: "Match a Swatch", ps: "د نمونې سمون", fa: "تطبیق نمونه" },
  navBecomeBuyer: { en: "Become a Buyer", ps: "پیرودونکی شئ", fa: "خریدار شوید" },
  navAdmin: { en: "Admin", ps: "اداره", fa: "مدیریت" },

  // Storefront
  heroEyebrow: { en: "The Swatch Book — Plain Textiles", ps: "د نمونو کتاب — ساده پارچې/ټوټې", fa: "کتاب نمونه‌ها — پارچه‌های ساده" },
  heroTitle: { en: "Every color, true to the bolt.", ps: "هر رنګ، د تان سره سم.", fa: "هر رنگ، مطابق با طاقه." },
  heroSubWholesale: { en: "Browse by shade, not by guesswork. Wholesale pricing shown — minimum 30m per color.", ps: "د رنګ له مخې وګورئ، نه د حدس له مخې. د عمده پلور نرخونه ښودل شوي — د هر رنګ لپاره لږترلږه ۳۰ متره.", fa: "بر اساس رنگ جستجو کنید، نه حدس. قیمت‌های عمده نمایش داده شده — حداقل ۳۰ متر برای هر رنگ." },
  heroSubRetail: { en: "Browse by shade, not by guesswork. Retail pricing shown — order a physical swatch before you commit.", ps: "د رنګ له مخې وګورئ، نه د حدس له مخې. د پرچون نرخونه ښودل شوي — بهتره ده چي له نږدې ټوکر/نمونه وګوری وروسته فرمایش ورکړی.", fa: "بر اساس رنگ جستجو کنید، نه حدس. قیمت‌های خرده‌فروشی نمایش داده شده — بهتر است تکه/نمونه را از نزدیک ببینید و بعداً سفارش دهید." },
  searchPlaceholder: { en: "Search a color or fabric — e.g. Dust Rose, Linen", ps: "یو رنګ یا پارچه ولټوئ — لکه Dust Rose، Linen", fa: "یک رنگ یا پارچه جستجو کنید — مثلاً Dust Rose، کتان" },
  retail: { en: "Retail", ps: "پرچون", fa: "خرده‌فروشی" },
  wholesale: { en: "Wholesale", ps: "عمده پلور", fa: "عمده‌فروشی" },
  all: { en: "All", ps: "ټول", fa: "همه" },
  wholesaleBanner: { en: "Wholesale account view — pricing is tiered and requires a 30m minimum per color. New buyers can request access from the shop.", ps: "د عمده پلور حساب — نرخونه درجه بندي شوي او د هر رنګ لپاره لږترلږه ۳۰ متره اړین دي. نوي پیرودونکي کولی شي له پلورنځي څخه لاسرسی وغواړي، ترڅو عمده نرخونه وکتلای سي.", fa: "نمای حساب عمده — قیمت‌ها طبقه‌بندی شده و حداقل ۳۰ متر برای هر رنگ نیاز است. خریداران جدید می‌توانند از فروشگاه درخواست دسترسی کنند. تا نرخهای عمده ببیند." },
  noResults: { en: "No fabrics match that search. Try a different color or fabric name.", ps: "هیڅ پارچه له دې لټون سره سمون نه خوري. بل رنګ یا د پارچې/ټوټې نوم وازمویئ.", fa: "هیچ پارچه‌ای با این جستجو مطابقت ندارد. رنگ یا نام پارچه دیگری را امتحان کنید." },
  colors: { en: "colors", ps: "رنګونه", fa: "رنگ‌ها" },

  // Product drawer
  widthLabel: { en: "width", ps: "پلنوالی", fa: "عرض" },
  handWash: { en: "Hand wash", ps: "په لاس مینځل", fa: "شستشو با دست" },
  perMeter: { en: "/meter", ps: "/متر", fa: "/متر" },
  wholesaleTierNote: { en: "Wholesale tier · min.", ps: "د عمده پلور کچه · لږترلږه", fa: "سطح عمده · حداقل" },
  order: { en: "order", ps: "فرمایش", fa: "سفارش" },
  orderWhatsapp: { en: "Order {min}m+ via WhatsApp", ps: "د وټساپ له لارې {min}متره+ فرمایش ورکړی", fa: "سفارش {min} متر+ از طریق واتساپ" },
  addToCart: { en: "Add to cart", ps: "کارت/ سبدې ته اضافه کړئ", fa: "افزودن به سبد خرید" },
  orderSwatchCard: { en: "Order a swatch card · {cur}20", ps: "د نمونې/ټوټې کارت فرمایش ورکړی · {cur}۲۰", fa: "سفارش کارت نمونه · {cur}۲۰" },
  colorDisclaimer: { en: "Colors shown are calibrated but may vary slightly by screen. Order a physical swatch before bulk purchase.", ps: "ښودل شوي رنګونه اصلاح/سم شوي دي مګر د سکرین له مخې لږ توپیر لري. مخکې له عمده رانیولو د یوه فزیکي نمونې/ټوټې غوښتنه وکړی.", fa: "رنگ‌های نمایش داده شده کالیبره شده‌اند اما ممکن است بسته به صفحه نمایش کمی متفاوت باشند. قبل از خرید عمده یک نمونه فیزیکی سفارش دهید." },

  // Stock
  outOfStock: { en: "Out of stock", ps: "په ګدام کي نسته", fa: "در ګدام موجود نیست" },
  lowStock: { en: "Low · {n}m left", ps: "لږ · فقط {n}متره پاته دی", fa: "کم · فقط {n} متر باقی‌مانده" },
  inStock: { en: "In stock · {n}m", ps: "موجود دی · {n}متره", fa: "موجود است · {n} متر" },

  // Matcher
  matcherEyebrow: { en: "Customer swatch matching", ps: "د مشتري د نمونې/ټوټې سمون", fa: "تطبیق نمونه مشتری" },
  matcherTitle: { en: "Match a fabric they brought in.", ps: "هغه پارچه/ټوټه پسي وګوری کوم چې مشتري له ځان سره راوړی.", fa: "پارچه‌ای که مشتری آورده‌اند را جستجو کنید." },
  matcherSub: { en: "Photograph the customer's piece or pick its shade directly, and every color in stock is ranked by how close it actually is — not just how it looks on screen.", ps: "د مشتري د راوړي ټوټې څخه عکس واخلی یا یې رنګ مستقیم وټاکئ، او هر رنګ چې زموږ په سیستم کي دی د دې پر بنسټ درجه بندي کیږي چې دواړه څومره سره ورته دي — نه دا چې په سکرین کې څنګه ښکاري.", fa: "از تکه پارچه مشتری عکس بگیرید یا رنگ آن را مستقیماً انتخاب کنید، و هر رنگ موجود در سیستم بر اساس نزدیکی واقعی آن رتبه‌بندی می‌شود — نه فقط ظاهر آن روی صفحه." },
  referenceColor: { en: "Reference color", ps: "یو عکس اپلوډ کړی، عکس واخلی یا یو رنګ انتخاب کړی", fa: "یک عکس را اپلود کنید، عکس بګیرید یا یک رنګ انتخاب کنید" },
  cameraBtn: { en: "Camera", ps: "کامره", fa: "دوربین" },
  uploadBtn: { en: "Upload", ps: "اپلوډ/پورته کول", fa: "اپلود/بارگذاری" },
  autoExtractHint: { en: "Color auto-extracted from photo center — fine-tune with the picker if lighting was off.", ps: "رنګ په اوتومات ډول د انځور له مرکز/منځ څخه انتخاب سوی — که رڼا سمه نه وه نو د ټاکنې وسیلې (د قلم نښې) سره یې سم کړئ.", fa: "رنگ به صورت خودکار از مرکز عکس استخراج شده — اگر نور مناسب نبود با انتخابگر (نشان قلم) تنظیم کنید." },
  stockOnlyFilter: { en: "Only show fabrics currently in stock", ps: "یوازې هغه پارچې/ټوټې وښایاست چي د اوس لپاره زموږ سره موجود دي", fa: "فقط پارچه‌های را نشان بدی که همرای ما فعلاً موجود است" },
  closestMatch: { en: "Closest match:", ps: "ترټولو ډېر ورته/سمون:", fa: "نزدیک‌ترین تطبیق:" },
  matchWord: { en: "match", ps: "سمون/ورته", fa: "تطبیق" },
  colFabric: { en: "Fabric", ps: "پارچه/ټوکر", fa: "پارچه/تکه" },
  colStock: { en: "Stock", ps: "ذخیره/ګدام", fa: "موجودی/ګدام" },
  colMatch: { en: "Match", ps: "سمون/ورته", fa: "تطبیق" },
  colPrice: { en: "Price", ps: "نرخ", fa: "قیمت" },
  matchExact: { en: "Exact match", ps: "پوره ورته والی/سمون", fa: "تطبیق دقیق" },
  matchExcellent: { en: "Excellent match", ps: "ډیر ښه ورته/سمون", fa: "تطبیق عالی" },
  matchGood: { en: "Good match", ps: "ښه ورته والی/سمون", fa: "تطبیق خوب" },
  matchFair: { en: "Noticeable difference", ps: "د پام وړ توپیر", fa: "تفاوت قابل توجه" },
  matchPoor: { en: "Different shade", ps: "بېل رنګ", fa: "سایه متفاوت" },

  // Camera
  captureTitle: { en: "Capture the customer's fabric", ps: "د مشتري له پارچې/ټوټې څخه عکس واخلی", fa: "عکس‌برداری از پارچه مشتری" },
  captureTip: { en: "Lay the fabric flat, fill the guide frame, and use natural daylight where possible — avoid direct flash.", ps: "پارچه هواره کیږدئ، د لارښود چوکاټ ډک کړئ، او که امکان ولري طبیعي رڼا وکاروئ — د موبایل د مستقیم فلش څخه ډډه وکړئ.", fa: "پارچه را صاف بگذارید، قاب راهنما را پر کنید و در صورت امکان از نور طبیعی روز استفاده کنید — از فلش مستقیم خودداری کنید." },
  captureBtn: { en: "Capture", ps: "عکس/انځور اخیستل", fa: "عکس‌برداری" },
  retakeBtn: { en: "Retake", ps: "بیا اخیستل (دوهم واري عکس واخلی)", fa: "گرفتن مجدد (دوباره عکس بګیرید)" },
  usePhotoBtn: { en: "Use this photo", ps: "دا انځور/عکس وکاروئ", fa: "استفاده از این عکس" },
  cameraUnavailable: { en: "Camera unavailable. Check browser permissions, or use file upload instead.", ps: "کمره شتون نلري. براوزر ته اجازه ورکړی، یا هم عکس اپلوډ/پورته کړی.", fa: "دوربین در دسترس نیست. مجوزهای مرورگر را بررسی کنید یا از بارگذاری فایل استفاده کنید." },
  lightTooDark: { en: "Too dark — move to better light", ps: "ډیر تیاره — ښه رڼا ته لاړ شئ", fa: "خیلی تاریک — به نور بهتر بروید" },
  lightOverexposed: { en: "Overexposed — avoid direct flash/glare", ps: "ډیر روښانه — د مستقیم فلش/زرغونتیا څخه ډډه وکړئ", fa: "بیش از حد روشن — از فلش مستقیم خودداری کنید" },
  lightBorderline: { en: "Lighting is okay but not ideal — try natural daylight", ps: "رڼا مناسبه ده مګر سمه نه ده — د دې پر ځای طبیعي رڼا کي عکس واخلی", fa: "نور قابل قبول اما ایده‌آل نیست — بجای این در نور طبیعی روز عکس بګیرید" },
  lightGood: { en: "Good lighting", ps: "ښه رڼا", fa: "نور مناسب" },

  // Wholesale request
  wholesaleEyebrow: { en: "Wholesale access", ps: "د عمده پلور لاسرسی", fa: "دسترسی عمده" },
  wholesaleFormTitle: { en: "Request a wholesale account.", ps: "د عمده پلور حساب وغواړئ.", fa: "درخواست حساب عمده." },
  wholesaleFormSub: { en: "For tailors, boutiques, and retailers ordering in bulk. We confirm every request by phone before unlocking wholesale pricing — takes 1–2 business days.", ps: "د خیاطانو، دوکاندارانو او پرچون پلورونکو لپاره چې غواړي په عمده توګه زموږ جنس رانیسي. موږ هره غوښتنه(د حساب خلاصولو لپاره) د تلیفون له لارې تایید کوو مخکې له دې چې تاسو د عمده پلور نرخونه وګوری — ۱-۲ ورځې وخت شاید ونیسي.", fa: "برای خیاطان، بوتیک‌ها و خرده‌فروشانی که میخواهند به صورت عمده سفارش ‌دهند. ما هر درخواست (برای بازکردن حساب) را از طریق تلفن تأیید می‌کنیم تا نرخهای عمده را ببینید— ۱ تا ۲ روز شاید طول بګیرد." },
  businessDetails: { en: "Business details", ps: "د سوداګرۍ معلومات /تفصیلات", fa: "جزئیات کسب‌وکار" },
  businessName: { en: "Business name", ps: "د سوداګرۍ نوم", fa: "نام کسب‌وکار" },
  businessNamePlaceholder: { en: "e.g. Meera Boutique", ps: "لکه؛ بست د ټوکرانو پلورنځی /هیواد خیاطي", fa: "مثلاً؛ فروشګاه تکه های بست/ خیاطی هیواد" },
  ownerName: { en: "Owner name", ps: "د مالک نوم", fa: "نام مالک" },
  fullName: { en: "Full name", ps: "بشپړ نوم", fa: "نام کامل" },
  phoneLabel: { en: "Phone (WhatsApp preferred)", ps: "تلیفون (وټساپ غوره ده)", fa: "تلفن (ترجیحاً واتساپ)" },
  gstLabel: { en: "GST / business reg. no.", ps: "د سوداګرۍ ثبت شمېره", fa: "شماره ثبت کسب‌وکار" },
  optional: { en: "(optional)", ps: "(اختیاري /حتمي نه دی)", fa: "(اختیاری/ حتمي نیست)" },
  gstPlaceholder: { en: "If registered", ps: "که ثبت شوی وي", fa: "در صورت ثبت" },
  shopAddress: { en: "Shop address — for delivery", ps: "د دوکان پته — د لیږد لپاره", fa: "آدرس مغازه — برای تحویل" },
  addressLine: { en: "Address line", ps: "آدرس", fa: "آدرس" },
  addressLinePlaceholder: { en: "Shop no., building, street", ps: "د دوکان شمېره، ودانۍ، سړک", fa: "شماره مغازه، ساختمان، خیابان" },
  landmark: { en: "Landmark", ps: "د دوکان د نښې ځای", fa: "نشانی معروف دوکان" },
  landmarkHint: { en: "(helps delivery find you)", ps: "(زموږ له کارکوونکي سره مرسته کوي ترڅو ستاسو ځای پیداکړي)", fa: "(به کارمند ما کمک می‌کند جای شما را پیدا کند)" },
  landmarkPlaceholder: { en: "e.g. Opposite City Bus Stand", ps: "لکه د فلاني کلینیک سره نږدې", fa: "مثلاً نزدیک به فلان کلینیک" },
  city: { en: "City", ps: "ښار", fa: "شهر" },
  state: { en: "State", ps: "ولایت", fa: "ایالت/استان" },
  pincode: { en: "PIN / postal code", ps: "پوستي کوډ", fa: "کد پستی" },
  pinLocationBtn: { en: "Pin my shop's exact location", ps: "زما د دوکان دقیق ځای په نقشه کي وګوری", fa: "مکان دقیق مغازه من را در نقشه ببینید" },
  pinLocating: { en: "Locating…", ps: "د ځای موندل روان دی…", fa: "در حال یافتن مکان…" },
  pinRetake: { en: "Location captured — retake", ps: "ځای ثبت شو — بیا وکړئ", fa: "مکان ثبت شد — دوباره" },
  geoHint: { en: "Best captured while standing inside your shop — this is what our delivery rider uses to navigate directly to you.", ps: "غوره ده چې د خپل دوکان دننه ولاړ یاست او دا ثبت کړئ — زموږ د لیږد کارکوونکی دا کاروي چې مستقیم تاسو ته ورسیږي.", fa: "بهتر است این را هنگام ایستادن داخل مغازه خود ثبت کنید — پیک تحویل ما از این برای رسیدن مستقیم به شما استفاده می‌کند." },
  geoUnavailable: { en: "Location isn't available on this device/browser — you can still submit without it.", ps: "ځای /موقعیت په دې تلیفون کې شتون نلري — تاسو بیا هم کولای شی پرته له دې یی موږ ته راواستوی.", fa: "مکان در این تلفن در دسترس نیست — همچنان می‌توانید بدون آن ارسال کنید." },
  geoFailed: { en: "Couldn't get your location — check permissions, or submit without it and we'll confirm by phone.", ps: "ستاسو ځای ونشو موندلی — په تلیفون کي دي اپشن ته اجازه ورکړی، یا پرته له دې مخته ولاړسی او موږ به یې د تلیفون له لارې تایید کړو.", fa: "مکان شما پیدا نشد — مجوزها را در تلفن تان بررسی کنید یا بدون آن ارسال کنید و ما از طریق تلفن تأیید می‌کنیم." },
  submitForReview: { en: "Submit for review", ps: "د بیاکتنې لپاره وسپارئ", fa: "ارسال برای بررسی" },
  requestSent: { en: "Request sent", ps: "غوښتنه ولیږل شوه", fa: "درخواست ارسال شد" },
  requestSentBody: { en: "We'll review {name} and confirm by phone within 1–2 business days. Once approved, wholesale pricing unlocks on your account.", ps: "موږ به {name} وګورو او د ۱-۲ ورځو دننه به یې د تلیفون له لارې تایید کړو. کله چې تایید شي، کولای سی زموږ د جنسونو عمده نرخونه وګوری.", fa: "ما {name} را بررسی کرده و ظرف ۱ تا ۲ روز از طریق تلفن تأیید می‌کنیم. پس از تأیید، قیمت‌های عمده در حساب شما باز می‌شود." },

  // Wholesale admin
  pendingReview: { en: "Pending review", ps: "د بیاکتنې په تمه", fa: "در انتظار بررسی" },
  approvedBuyers: { en: "Approved buyers", ps: "تاییدشوي پیرودونکي", fa: "خریداران تأیید شده" },
  rejected: { en: "Rejected", ps: "رد شوی", fa: "رد شده" },
  pendingRequests: { en: "Pending requests", ps: "په تمه غوښتنې", fa: "درخواست‌های در انتظار" },
  noApprovedBuyers: { en: "No approved wholesale buyers yet.", ps: "تر اوسه هیڅ تایید شوی عمده پیرودونکی نشته.", fa: "هنوز خریدار عمده تأیید شده‌ای وجود ندارد." },
  approveBtn: { en: "Approve", ps: "تایید", fa: "تأیید" },
  rejectBtn: { en: "Reject", ps: "رد کول", fa: "رد کردن" },
  openInMaps: { en: "Open exact pin in Maps", ps: "په نقشه کې دقیق ځای خلاص کړئ", fa: "باز کردن مکان دقیق در نقشه" },
  noPinCaptured: { en: "No GPS pin captured — confirm by phone", ps: "هیڅ GPS ځای نه دی ثبت شوی — د تلیفون له لارې تایید کړئ", fa: "هیچ مکان GPS ثبت نشده — از طریق تلفن تأیید کنید" },

  // Admin inventory
  totalSkus: { en: "Total SKUs", ps: "ټول SKUs", fa: "تعداد کل اقلام" },
  metersInStock: { en: "Meters in stock", ps: "مترونه په دوکان/ګدام کي دي", fa: "متر موجود در دوکان /انبار" },
  lowStockLabel: { en: "Low stock", ps: "لږه ذخیره", fa: "موجودی کم" },
  outOfStockLabel: { en: "Out of stock", ps: "ذخیره ختمه شوې", fa: "ناموجود" },
  inventory: { en: "Inventory", ps: "د جنسونو لیست", fa: "لیست جنسها" },
  addFabric: { en: "Add fabric", ps: "پارچه/ ټوکر اضافه کړئ", fa: "افزودن پارچه/ تکه" },
  tableColor: { en: "Color", ps: "رنګ", fa: "رنگ" },
  tableFabric: { en: "Fabric", ps: "ټوکر/ پارچه", fa: "تکه/ پارچه" },
  tableSku: { en: "SKU", ps: "SKU", fa: "SKU" },
  tableWidth: { en: "Width", ps: "پلنوالی", fa: "عرض" },
  tableRetail: { en: "Retail", ps: "پرچون", fa: "خرده‌فروشی" },
  tableWholesale: { en: "Wholesale", ps: "عمده پلور", fa: "عمده‌فروشی" },
  tableStock: { en: "Stock", ps: "ذخیره", fa: "موجودی" },
  editFabric: { en: "Edit fabric", ps: "پارچه سمول", fa: "ویرایش پارچه" },
  addFabricTitle: { en: "Add fabric", ps: "پارچه/ ټوکر اضافه کړئ", fa: "افزودن پارچه" },
  fabricType: { en: "Fabric type", ps: "د ټوکر/پارچې ډول", fa: "نوع پارچه" },
  colorName: { en: "Color name", ps: "د رنګ نوم", fa: "نام رنگ" },
  colorNamePlaceholder: { en: "e.g. Dust Rose", ps: "لکه Dust Rose", fa: "مثلاً Dust Rose" },
  swatchColor: { en: "Swatch color", ps: "د نمونې رنګ", fa: "رنگ نمونه" },
  skuLabel: { en: "SKU", ps: "SKU", fa: "کد کالا" },
  skuPlaceholder: { en: "e.g. CTN-DRS-44", ps: "لکه CTN-DRS-44", fa: "مثلاً CTN-DRS-44" },
  widthIn: { en: "Width (in)", ps: "پلنوالی (سانتي متر)", fa: "عرض (سانتي متر)" },
  gsmLabel: { en: "GSM", ps: "GSM", fa: "GSM" },
  retailPricePerM: { en: "Retail price/m", ps: "د پرچون نرخ/متر", fa: "قیمت خرده/متر" },
  wholesalePricePerM: { en: "Wholesale price/m", ps: "د عمده پلور نرخ/متر", fa: "قیمت عمده/متر" },
  stockMeters: { en: "Stock (meters)", ps: "ذخیره/گدام (متره)", fa: "موجودی/گدام (متر)" },
  saveChanges: { en: "Save changes", ps: "بدلونونه ثبت کړئ", fa: "ذخیره تغییرات" },
  addToInventory: { en: "Add to inventory", ps: "لیست ته اضافه کړئ", fa: "افزودن به انبار" },
  wholesaleBuyersTab: { en: "Wholesale Buyers", ps: "عمده پیرودونکي", fa: "خریداران عمده" },
  deleteFabricTitle: { en: "Delete this fabric?", ps: "دا پارچه/ ټوټه ډیلیټ شي؟", fa: "این پارچه حذف شود؟" },
  deleteFabricBody: { en: "\"{name}\" will be permanently removed from inventory. This can't be undone.", ps: "\"{name}\" به د تل لپاره له لیست څخه لرې شي. دا بیرته نه شي ګرځیدای.", fa: "\"{name}\" برای همیشه از انبار حذف می‌شود. این عمل قابل بازگشت نیست." },
  deleteConfirmBtn: { en: "Delete", ps: "ډیلیټ کول", fa: "حذف" },
  cancelBtn: { en: "Cancel", ps: "لغوه کول", fa: "لغو" },
  deleteAccountBtn: { en: "Delete account", ps: "حساب ړنګول", fa: "حذف حساب" },
  deleteWholesaleTitle: { en: "Delete this wholesale account?", ps: "دا عمده حساب ړنګ شي؟", fa: "این حساب عمده حذف شود؟" },
  deleteWholesaleBody: { en: "\"{name}\" will lose access permanently and won't be able to sign back in. This can't be undone.", ps: "\"{name}\" به تل لپاره لاسرسی له لاسه ورکړي او بیا ننوتل نشي کولی. دا بیرته نه شي کیدای.", fa: "\"{name}\" برای همیشه دسترسی را از دست می‌دهد و دیگر نمی‌تواند وارد شود. این عمل قابل بازگشت نیست." },

  statusPending: { en: "pending", ps: "په تمه", fa: "در انتظار" },
  statusApproved: { en: "approved", ps: "تاییدشوی", fa: "تأیید شده" },
  statusRejected: { en: "rejected", ps: "رد شوی", fa: "رد شده" },

  // Cart
  addToOrder: { en: "Add to order", ps: "د فرمایشاتو لیست ته یی اضافه کړئ", fa: "افزودن به لیست سفارشها" },
  addedToOrder: { en: "Added ✓", ps: "اضافه شو ✓", fa: "افزوده شد ✓" },
  orderQuick: { en: "or order this item alone:", ps: "یا یوازې د همدې جنس غوښتنه وکړی:", fa: "یا فقط همین کالا را سفارش دهید:" },
  cartTitle: { en: "Your order", ps: "ستاسو امر/فرمایش", fa: "سفارش شما" },
  cartEmpty: { en: "No items added yet. Browse fabrics and tap \"Add to order.\"", ps: "تر اوسه هیڅ جنسونه نه دي اضافه شوی. پارچې/ ټوکران وګورئ او \"د فرمایشاتو لیست ته یی اضافه کړئ\" بټن ووهی.", fa: "هنوز کالایی اضافه نشده. پارچه‌ها را مرور کنید و «افزودن به سفارش» را بزنید." },
  cartQuantity: { en: "Quantity (m)", ps: "اندازه (متره)", fa: "مقدار (متر)" },
  cartCustomQty: { en: "Custom", ps: "خاص فرمایش", fa: "سفارشی" },
  cartRemove: { en: "Remove", ps: "لرې کول", fa: "حذف" },
  cartTotal: { en: "Total", ps: "ټول", fa: "مجموع" },
  cartTotalMeters: { en: "meters", ps: "متره", fa: "متر" },
  cartMinNotice: { en: "Wholesale minimum is {min}m per color — items below this will be flagged when you send.", ps: "د عمده پلور لږترلږه اندازه د هر رنګ لپاره {min}متره ده — هغه جنسونه به د فرمایش پر وخت په نښه سي چي له دې اندازي څخه کم دي.", fa: "حداقل عمده {min} متر برای هر رنگ است — کالاهای کمتر از این هنگام ارسال علامت‌گذاری می‌شوند." },
  belowMinimum: { en: "Below {min}m minimum", ps: "تاسو دا جنس له {min}متره کم انتخاب کړی", fa: "این جنس را کمتر از {min} متر انتخاب کردید" },
  sendViaWhatsapp: { en: "Send order via WhatsApp", ps: "امر/فرمایش د وټساپ له لارې واستوی", fa: "ارسال سفارش از طریق واتساپ" },
  cartClear: { en: "Clear order", ps: "فرمایش پاک کړئ", fa: "پاک کردن سفارش" },
  viewOrder: { en: "View order", ps: "فرمایش وګورئ", fa: "مشاهده سفارش" },
  continueBrowsing: { en: "Continue browsing", ps: "د نورو ټوکرانو لټون ته دوام ورکړئ", fa: "ادامه مرور برای تکه های دیګر" },

  // Auth — staff/admin
  staffLogin: { en: "Staff Login", ps: "د کارکوونکو ننوتل", fa: "ورود کارکنان" },
  staffLoginTitle: { en: "Staff sign in", ps: "د کارکوونکو ننوتل", fa: "ورود کارکنان" },
  staffLoginSub: { en: "For shop owner and staff access only.", ps: "یوازې د دوکان مالک او کارکوونکو د لاسرسي لپاره.", fa: "فقط برای دسترسی مالک و کارکنان مغازه." },
  usernameLabel: { en: "Username", ps: "کارن نوم (یوزر نېم)", fa: "نام کاربری (یوزرنیم)" },
  passwordLabel: { en: "Password", ps: "پټ نوم", fa: "رمز عبور" },
  signIn: { en: "Sign in", ps: "ننوتل", fa: "ورود" },
  signOut: { en: "Sign out", ps: "وتل", fa: "خروج" },
  loginError: { en: "Incorrect username or password.", ps: "ناسم کارن نوم یا پټ نوم.", fa: "نام کاربری یا رمز عبور اشتباه است." },
  roleOwner: { en: "Owner", ps: "مالک", fa: "مالک" },
  roleStaff: { en: "Staff", ps: "کارکوونکی", fa: "کارمند" },
  staffNoPermission: { en: "Only the shop owner can approve or reject wholesale accounts.", ps: "یوازې د دوکان مالک کولی شي د عمده پلور حسابونه تایید یا رد کړي.", fa: "فقط مالک مغازه می‌تواند حساب‌های عمده را تأیید یا رد کند." },
  setPasswordOnApprove: { en: "Set a login password for this buyer", ps: "د دې پیرودونکي لپاره د ننوتلو پټنوم وټاکئ", fa: "رمز عبور ورود برای این خریدار تنظیم کنید" },
  passwordPlaceholder: { en: "Choose a password", ps: "پټنوم وټاکئ", fa: "یک رمز عبور انتخاب کنید" },
  approveAndSetPassword: { en: "Approve & set password", ps: "تایید او پټ نوم ټاکل", fa: "تأیید و تنظیم رمز عبور" },
  loginCredentialsSet: { en: "Login: phone {phone}, password set", ps: "ننوتل: تلیفون {phone}، پټ نوم ټاکل شوی", fa: "ورود: تلفن {phone}، رمز عبور تنظیم شد" },

  // Auth — wholesale buyer
  wholesaleLogin: { en: "Wholesale Login", ps: "د عمده پلور ننوتل", fa: "ورود عمده" },
  wholesaleLoginTitle: { en: "Wholesale buyer sign in", ps: "د عمده پیرودونکي ننوتل", fa: "ورود خریدار عمده" },
  wholesaleLoginSub: { en: "For approved wholesale accounts. New here?", ps: "د تایید شوو عمده حسابونو لپاره. نوی یاست؟", fa: "برای حساب‌های عمده تأیید شده. تازه‌کار هستید؟" },
  requestAccessLink: { en: "Request wholesale access", ps: "د عمده لاسرسي غوښتنه", fa: "درخواست دسترسی عمده" },
  phoneNumberLabel: { en: "Phone number", ps: "د تلیفون شمېره", fa: "شماره تلفن" },
  wholesaleLoginError: { en: "No approved account found with that phone and password.", ps: "د دې تلیفون او پټ نوم سره هیڅ تایید شوی حساب ونه موندل شو.", fa: "هیچ حساب تأیید شده‌ای با این تلفن و رمز عبور یافت نشد." },
  loggedInAs: { en: "Logged in as", ps: "ننوتلی په توګه", fa: "وارد شده به عنوان" },
  wholesaleAccessLocked: { en: "Wholesale pricing is only visible to approved buyers.", ps: "د عمده پلور نرخونه یوازې تایید شوو پیرودونکو ته ښکاره دي.", fa: "قیمت‌های عمده فقط برای خریداران تأیید شده قابل مشاهده است." },

  // Wholesale signup — password + errors
  choosePassword: { en: "Choose a password", ps: "پټ نوم وټاکئ", fa: "یک رمز عبور انتخاب کنید" },
  choosePasswordPlaceholder: { en: "For logging in later", ps: "د راتلونکي ننوتلو لپاره", fa: "برای ورود بعدی" },
  phoneAlreadyRegistered: { en: "This phone number is already registered.", ps: "دا د تلیفون شمېره دمخه ثبت شوې ده.", fa: "این شماره تلفن قبلاً ثبت شده است." },
  signupFailed: { en: "Something went wrong — please try again.", ps: "یو څه غلط شول — بیا هڅه وکړئ.", fa: "مشکلی پیش آمد — لطفاً دوباره تلاش کنید." },
  loadingText: { en: "Loading…", ps: "بارول کیږي (په تمه شی)…", fa: "در حال بارگذاری (منتظر باشید)…" },

  // Contact / business address section
  navContact: { en: "Contact", ps: "اړیکه", fa: "تماس" },
  contactTitle: { en: "Visit or contact us", ps: "زموږ دوکان له نږدې وګوری یا اړیکه ونیسئ", fa: "ما را ملاقات یا با ما تماس بگیرید" },
  contactSub: { en: "Come see the fabrics in person, or reach out directly.", ps: "ټوکر مخامخ وګوری، یا مستقیم اړیکه ونیسئ.", fa: "پارچه‌ها را حضوری ببینید یا مستقیماً تماس بگیرید." },
  ourAddress: { en: "Our address", ps: "زموږ آدرس", fa: "آدرس ما" },
  openInMapsBtn: { en: "Open in Maps", ps: "په نقشه کې خلاص کړئ", fa: "باز کردن در نقشه" },
  chatOnWhatsapp: { en: "Chat on WhatsApp", ps: "په وټساپ کې پیغام ولېږئ", fa: "چت در واتساپ" },
  callUs: { en: "Call us", ps: "موږ ته زنګ ووهئ", fa: "با ما تماس بگیرید" },
  addressPlaceholderNote: { en: "Placeholder address — update SHOP_INFO in the code with your real location.", ps: "دا یوه بیلګه پته ده — کوډ کې SHOP_INFO د خپلې ریښتینې پتې سره تازه کړئ.", fa: "این یک آدرس نمونه است — SHOP_INFO را در کد با موقعیت واقعی خود به‌روزرسانی کنید." },
};

function useTranslation(lang) {
  return (key, vars) => {
    let str = STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };
}

const LanguageContext = createContext({ lang: "en", t: (k) => k, dir: "ltr" });
const useLang = () => useContext(LanguageContext);


// ---------------------------------------------------------------------------
// COLOR SCIENCE — hex -> LAB -> Delta E (CIE76), the industry-standard method
// for perceptual color matching (used by textile/paint companies). Plain RGB
// distance looks close on screen but misleads on real fabric matches.
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function rgbToXyz({ r, g, b }) {
  let [rr, gg, bb] = [r, g, b].map((v) => {
    v = v / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  rr *= 100; gg *= 100; bb *= 100;
  return {
    x: rr * 0.4124 + gg * 0.3576 + bb * 0.1805,
    y: rr * 0.2126 + gg * 0.7152 + bb * 0.0722,
    z: rr * 0.0193 + gg * 0.1192 + bb * 0.9505,
  };
}

function xyzToLab({ x, y, z }) {
  const ref = { x: 95.047, y: 100.0, z: 108.883 }; // D65 reference white
  let [xr, yr, zr] = [x / ref.x, y / ref.y, z / ref.z].map((v) =>
    v > 0.008856 ? Math.pow(v, 1 / 3) : 7.787 * v + 16 / 116
  );
  return { l: 116 * yr - 16, a: 500 * (xr - yr), b: 200 * (yr - zr) };
}

function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

// CIE76 Delta-E: 0 = identical, ~1 = imperceptible, ~2-3 = noticeable to a
// trained eye, ~5+ = clearly different, 10+ = different colors entirely.
function deltaE(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

// Convert Delta-E into a friendly match % + label for shop staff to read at
// a glance. Non-linear so small (meaningful) differences spread out more
// than large ones. Returns a translation key rather than a hardcoded label
// since this is a plain function, not a component (can't use hooks here).
function matchScore(de) {
  const pct = Math.max(0, Math.round(100 * Math.exp(-de / 9)));
  let labelKey, cls;
  if (de < 1) { labelKey = "matchExact"; cls = "match-exact"; }
  else if (de < 3) { labelKey = "matchExcellent"; cls = "match-excellent"; }
  else if (de < 6) { labelKey = "matchGood"; cls = "match-good"; }
  else if (de < 12) { labelKey = "matchFair"; cls = "match-fair"; }
  else { labelKey = "matchPoor"; cls = "match-poor"; }
  return { pct, labelKey, cls, de };
}

// Extract the dominant/average color from an uploaded photo of a fabric
// swatch by sampling pixels from the center region of the image (avoids
// shadows/edges near the border of a typical close-up photo).
function extractDominantColor(imageEl) {
  const canvas = document.createElement("canvas");
  const size = 60;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const sx = imageEl.naturalWidth * 0.25;
  const sy = imageEl.naturalHeight * 0.25;
  const sw = imageEl.naturalWidth * 0.5;
  const sh = imageEl.naturalHeight * 0.5;
  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
    count++;
  }
  r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// WHATSAPP ORDER MESSAGE — a wa.me link only pre-fills ONE text message, so
// multi-item orders are built as a single formatted message listing every
// line item, rather than trying to send items one at a time.
// ---------------------------------------------------------------------------

function buildWhatsAppOrderUrl(items, mode, buyerLabel) {
  const lines = items.map(
    (item, i) =>
      `${i + 1}. ${item.product.colorName} (${item.product.fabricType}, ${item.product.width}") — ${item.qty}m`
  );
  const totalMeters = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const header = mode === "wholesale" ? "New Wholesale Order" : "New Order";
  const messageParts = [
    header + (buyerLabel ? ` — ${buyerLabel}` : ""),
    "",
    ...lines,
    "",
    `Total: ${totalMeters}m`,
  ];
  const text = encodeURIComponent(messageParts.join("\n"));
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${text}`;
}

// ---------------------------------------------------------------------------
// SAMPLE DATA — mirrors the real data model: FabricType -> Colors -> Variants
// Note: actual product/account data now comes from src/lib/api.js (either
// Supabase or the local offline layer) — see the useEffect data loading in
// the app shell below. Only static config constants live here.
// ---------------------------------------------------------------------------

const FABRIC_TYPES = ["Cotton", "Georgette", "Crepe", "Chiffon", "Silk", "Linen"];

const WHOLESALE_MIN_METERS = 30;

// Currency symbol used throughout pricing display — Afghan Afghani.
const CURRENCY_SYMBOL = "؋";

// Shop's WhatsApp number for order messages — replace with the real shop
// number. Format: country code + number, no spaces/dashes/plus sign.
const SHOP_WHATSAPP_NUMBER = "0704050709";

// Placeholder shop details — replace with your real address, coordinates,
// and contact numbers. Shown on the Contact page.
const SHOP_INFO = {
  addressLine: "دوکان نمبر ۱۲، زنانه مارکیټ، گرشک بازار",
  addressArea: "ګرشک، هلمند",
  lat: 34.5553,
  lng: 69.2075,
  whatsappDisplay: "0704050709",
  phoneDisplay: "0704050709",
};

// Quantity presets shown as quick-tap buttons in the cart, per pricing mode.
const QTY_PRESETS = {
  retail: [1, 3, 5],
  wholesale: [30, 60, 90],
};

// ---------------------------------------------------------------------------
// SHARED UI BITS
// ---------------------------------------------------------------------------

function StockBadge({ meters }) {
  const { t } = useLang();
  let label, cls;
  if (meters === 0) { label = t("outOfStock"); cls = "stock-out"; }
  else if (meters < 20) { label = t("lowStock", { n: meters }); cls = "stock-low"; }
  else { label = t("inStock", { n: meters }); cls = "stock-ok"; }
  return <span className={`stock-badge ${cls}`}>{label}</span>;
}

function SwatchTile({ product, mode, onOpen }) {
  return (
    <button className="swatch-tile" onClick={() => onOpen(product)}>
      <span className="swatch-color" style={{ background: product.hex }} />
      <span className="swatch-meta">
        <span className="swatch-name">{product.colorName}</span>
        <span className="swatch-sub">
          {product.fabricType} · {product.width}"
        </span>
        <span className="swatch-price">
          {mode === "wholesale"
            ? `${CURRENCY_SYMBOL}${product.wholesalePrice}/m`
            : `${CURRENCY_SYMBOL}${product.retailPrice}/m`}
        </span>
      </span>
    </button>
  );
}

function ProductDrawer({ product, mode, onClose, onAddToCart, cartQty }) {
  const { t } = useLang();
  const [added, setAdded] = useState(false);
  if (!product) return null;
  const price = mode === "wholesale" ? product.wholesalePrice : product.retailPrice;
  const minQty = mode === "wholesale" ? WHOLESALE_MIN_METERS : 1;

  function handleAddToCart() {
    onAddToCart(product, minQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleQuickOrder() {
    const url = buildWhatsAppOrderUrl([{ product, qty: minQty }], mode);
    window.open(url, "_blank");
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        <div className="drawer-hero" style={{ background: product.hex }}>
          <div className="drawer-hero-texture" />
        </div>
        <div className="drawer-body">
          <p className="eyebrow">{product.fabricType} · {product.sku}</p>
          <h2>{product.colorName}</h2>
          <div className="spec-row">
            <span><Ruler size={14} /> {product.width}" {t("widthLabel")}</span>
            <span><Layers size={14} /> {product.gsm} GSM</span>
            <span><Droplets size={14} /> {t("handWash")}</span>
          </div>
          <StockBadge meters={product.stockMeters} />

          <div className="price-block">
            <span className="price-big">{CURRENCY_SYMBOL}{price}<span className="price-unit">{t("perMeter")}</span></span>
            {mode === "wholesale" && (
              <span className="price-note">{t("wholesaleTierNote")} {minQty}m {t("order")}</span>
            )}
          </div>

          <div className="drawer-actions">
            <button className="btn btn-primary" disabled={product.stockMeters === 0} onClick={handleAddToCart}>
              <Plus size={15} /> {added ? t("addedToOrder") : cartQty ? `${t("addToOrder")} (${cartQty}m ${t("cartTotalMeters")})` : t("addToOrder")}
            </button>
            {mode === "retail" && (
              <button className="btn btn-ghost">{t("orderSwatchCard", { cur: CURRENCY_SYMBOL })}</button>
            )}
            <div className="drawer-quick-order">
              <span className="drawer-quick-label">{t("orderQuick")}</span>
              <button className="btn btn-ghost btn-sm" disabled={product.stockMeters === 0} onClick={handleQuickOrder}>
                {t("orderWhatsapp", { min: minQty })}
              </button>
            </div>
          </div>
          <p className="drawer-footnote">
            {t("colorDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STOREFRONT VIEW
// ---------------------------------------------------------------------------

function Storefront({ products, mode, setMode, cart, onAddToCart, canToggleWholesale, onWholesaleLoginClick }) {
  const { t } = useLang();
  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const [openProduct, setOpenProduct] = useState(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesType = activeType === "All" || p.fabricType === activeType;
      const matchesQuery =
        query.trim() === "" ||
        p.colorName.toLowerCase().includes(query.toLowerCase()) ||
        p.fabricType.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [products, activeType, query]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      if (!map[p.fabricType]) map[p.fabricType] = [];
      map[p.fabricType].push(p);
    });
    return map;
  }, [filtered]);

  return (
    <div className="storefront">
      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow">{t("heroEyebrow")}</p>
          <h1>{t("heroTitle")}</h1>
          <p className="hero-sub">
            {mode === "wholesale" ? t("heroSubWholesale") : t("heroSubRetail")}
          </p>
        </div>
        <div className="hero-strip">
          {products.slice(0, 10).map((p) => (
            <span key={p.id} className="hero-chip" style={{ background: p.hex }} />
          ))}
        </div>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {canToggleWholesale ? (
          <div className="mode-toggle">
            <button className={mode === "retail" ? "active" : ""} onClick={() => setMode("retail")}>
              <Store size={14} /> {t("retail")}
            </button>
            <button className={mode === "wholesale" ? "active" : ""} onClick={() => setMode("wholesale")}>
              <ShieldCheck size={14} /> {t("wholesale")}
            </button>
          </div>
        ) : (
          <button className="wholesale-login-prompt" onClick={onWholesaleLoginClick}>
            <ShieldCheck size={14} /> {t("wholesaleLogin")}
          </button>
        )}
      </div>

      <div className="type-tabs">
        <button className={activeType === "All" ? "active" : ""} onClick={() => setActiveType("All")}>{t("all")}</button>
        {FABRIC_TYPES.map((ft) => (
          <button key={ft} className={activeType === ft ? "active" : ""} onClick={() => setActiveType(ft)}>
            {ft}
          </button>
        ))}
      </div>

      {mode === "wholesale" && (
        <div className="wholesale-banner">
          <ShieldCheck size={16} />
          {t("wholesaleBanner")}
        </div>
      )}

      {Object.keys(grouped).length === 0 && (
        <p className="empty-state">{t("noResults")}</p>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <section key={type} className="chapter">
          <div className="chapter-head">
            <h3>{type}</h3>
            <span className="chapter-count">{items.length} {t("colors")}</span>
          </div>
          <div className="swatch-grid">
            {items.map((p) => (
              <SwatchTile key={p.id} product={p} mode={mode} onOpen={setOpenProduct} />
            ))}
          </div>
        </section>
      ))}

      <ProductDrawer
        product={openProduct}
        mode={mode}
        onClose={() => setOpenProduct(null)}
        onAddToCart={onAddToCart}
        cartQty={openProduct ? cart.find((i) => i.product.id === openProduct.id)?.qty : null}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MATCH A SWATCH — staff-facing tool. A customer brings in a physical fabric
// piece; staff either photograph it or pick its color, and every product in
// stock is ranked by Delta-E perceptual closeness.
// ---------------------------------------------------------------------------

function MatchResultRow({ product, score, mode, onOpen }) {
  const { t } = useLang();
  return (
    <button className="match-row" onClick={() => onOpen(product)}>
      <span className="match-swatch" style={{ background: product.hex }} />
      <span className="match-info">
        <span className="match-name">{product.colorName}</span>
        <span className="match-sub">{product.fabricType} · {product.width}" · {product.sku}</span>
      </span>
      <span className="match-stock"><StockBadge meters={product.stockMeters} /></span>
      <span className={`match-score ${score.cls}`}>
        <span className="match-pct">{score.pct}%</span>
        <span className="match-label">{t(score.labelKey)}</span>
      </span>
      <span className="match-price">
        {mode === "wholesale" ? `${CURRENCY_SYMBOL}${product.wholesalePrice}/m` : `${CURRENCY_SYMBOL}${product.retailPrice}/m`}
      </span>
      <ChevronRight size={16} className="match-arrow" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// CAMERA CAPTURE — live viewfinder with a center guide frame and a basic
// brightness check, so staff get instant feedback if the shot is too dark/
// too bright before it's used for color extraction (bad lighting is the
// #1 cause of bad matches, more than the matching math itself).
// ---------------------------------------------------------------------------

function assessBrightness(imageEl) {
  const canvas = document.createElement("canvas");
  const size = 40;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const sx = imageEl.naturalWidth ? imageEl.naturalWidth * 0.25 : 0;
  const sy = imageEl.naturalHeight ? imageEl.naturalHeight * 0.25 : 0;
  const sw = imageEl.naturalWidth ? imageEl.naturalWidth * 0.5 : imageEl.videoWidth;
  const sh = imageEl.naturalHeight ? imageEl.naturalHeight * 0.5 : imageEl.videoHeight;
  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let sum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    count++;
  }
  const avg = sum / count;
  if (avg < 60) return { level: "dark", labelKey: "lightTooDark", cls: "light-bad" };
  if (avg > 205) return { level: "bright", labelKey: "lightOverexposed", cls: "light-bad" };
  if (avg < 90 || avg > 180) return { level: "borderline", labelKey: "lightBorderline", cls: "light-warn" };
  return { level: "good", labelKey: "lightGood", cls: "light-good" };
}

function CameraCapture({ onCapture, onClose }) {
  const { t } = useLang();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [brightness, setBrightness] = useState(null);
  const [frozen, setFrozen] = useState(null);

  React.useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment", width: 640, height: 480 } })
      .then((s) => {
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError(t("cameraUnavailable")));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!videoRef.current || frozen) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        setBrightness(assessBrightness(videoRef.current));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [frozen]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setFrozen(dataUrl);
    stream?.getTracks().forEach((t) => t.stop());
  }

  function retake() {
    setFrozen(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment", width: 640, height: 480 } })
      .then((s) => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError(t("cameraUnavailable")));
  }

  function confirm() {
    onCapture(frozen);
    onClose();
  }

  return (
    <div className="camera-backdrop" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        <h3>{t("captureTitle")}</h3>
        <p className="camera-tip">{t("captureTip")}</p>

        <div className="camera-viewport">
          {error && <div className="camera-error">{error}</div>}
          {!error && !frozen && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <div className="camera-guide-frame" />
              {brightness && (
                <div className={`camera-brightness ${brightness.cls}`}>{t(brightness.labelKey)}</div>
              )}
            </>
          )}
          {frozen && <img src={frozen} alt="Captured swatch" className="camera-video" />}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="camera-actions">
          {!frozen ? (
            <button className="btn btn-primary" onClick={capture} disabled={!!error}>
              <Camera size={16} /> {t("captureBtn")}
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={retake}>{t("retakeBtn")}</button>
              <button className="btn btn-primary" onClick={confirm}>{t("usePhotoBtn")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SwatchMatcher({ products, mode, onOpen, currentUser }) {
  const { t } = useLang();
  const [targetHex, setTargetHex] = useState("#C9A29A");
  const [uploadedImg, setUploadedImg] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // AI matching (Phase 6) is opt-in, not automatic: Delta-E color matching
  // is instant and fully client-side, so it stays the default experience.
  // AI matching needs a real photo and a server round-trip, so it's
  // triggered explicitly once a photo exists, rather than silently
  // replacing the fast path on every interaction.
  const [aiResults, setAiResults] = useState(null); // null = not tried; array = AI results; also tracks aiAvailable
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImg(url);
    setUploadedFile(file);
    setAiResults(null);
    setAiError(null);
  }

  function handleImgLoad() {
    if (imgRef.current) {
      const extracted = extractDominantColor(imgRef.current);
      setTargetHex(extracted);
    }
  }

  async function handleTryAiMatch() {
    setAiLoading(true);
    setAiError(null);
    try {
      let queryImageUrl = null;
      if (uploadedFile && api.isBackendLive) {
        // The Edge Function fetches the image server-side, so it needs a
        // reachable URL, not the raw file — upload it to Storage first
        // (reusing the fabric-photos bucket's upload path pattern, tagged
        // as a query rather than a catalog photo).
        queryImageUrl = await api.uploadFabricPhoto(uploadedFile, "query");
      }
      const result = await api.matchFabric({ queryImageUrl, queryHex: targetHex, inStockOnly, products });
      setAiResults(result);
    } catch (err) {
      setAiError(err.message || "AI matching failed — showing color-only results instead.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSelectMatch(product, rank) {
    if (!aiResults) return;
    try {
      await api.recordMatchFeedback({
        selectedFabricId: product.id,
        selectedRank: rank,
        aiScore: aiResults.results.find((r) => r.fabricId === product.id)?.score ?? null,
        createdBy: currentUser?.id,
      });
    } catch {
      // Feedback recording is best-effort — never block opening the product over it.
    }
    onOpen(product);
  }

  const targetLab = useMemo(() => hexToLab(targetHex), [targetHex]);

  const deltaEResults = useMemo(() => {
    return products
      .filter((p) => !inStockOnly || p.stockMeters > 0)
      .map((p) => {
        const de = deltaE(targetLab, hexToLab(p.hex));
        return { product: p, score: matchScore(de) };
      })
      .sort((a, b) => a.score.de - b.score.de);
  }, [products, targetLab, inStockOnly]);

  // When AI results exist, re-rank the same product list using the hybrid
  // score instead of pure Delta-E — but keep using matchScore()'s
  // Delta-E-derived label/percent for display, since that's still the
  // most interpretable "how close is this color" figure for a merchant,
  // even when AI similarity picked the ordering.
  const ranked = useMemo(() => {
    if (!aiResults) return deltaEResults;
    const scoreByFabric = Object.fromEntries(aiResults.results.map((r) => [r.fabricId, r]));
    return deltaEResults
      .filter((row) => scoreByFabric[row.product.id])
      .sort((a, b) => scoreByFabric[b.product.id].score - scoreByFabric[a.product.id].score);
  }, [deltaEResults, aiResults]);

  const best = ranked[0];

  return (
    <div className="matcher">
      <div className="matcher-intro">
        <p className="eyebrow">{t("matcherEyebrow")}</p>
        <h1>{t("matcherTitle")}</h1>
        <p className="hero-sub">
          {t("matcherSub")}
        </p>
      </div>

      <div className="matcher-input-card">
        <div className="matcher-target">
          <div className="target-preview" style={{ background: targetHex }}>
            {!uploadedImg && <Pipette size={22} className="target-icon" />}
          </div>
          <div className="target-controls">
            <label className="mini-label">{t("referenceColor")}</label>
            <div className="hex-input-row">
              <input
                type="color"
                value={targetHex}
                onChange={(e) => setTargetHex(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={targetHex}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setTargetHex(e.target.value)}
                className="hex-text"
                spellCheck={false}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCamera(true)}>
                <Camera size={14} /> {t("cameraBtn")}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> {t("uploadBtn")}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </div>
            {uploadedImg && (
              <p className="matcher-hint">
                <Sparkles size={12} /> {t("autoExtractHint")}
              </p>
            )}
          </div>
        </div>

        {uploadedImg && (
          <img
            ref={imgRef}
            src={uploadedImg}
            alt="Uploaded swatch"
            onLoad={handleImgLoad}
            className="matcher-uploaded-img"
          />
        )}

        {uploadedImg && (
          <div className="ai-match-control">
            <button className="btn btn-ghost btn-sm" onClick={handleTryAiMatch} disabled={aiLoading}>
              {aiLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Try AI visual match
            </button>
            {aiResults && aiResults.aiAvailable && (
              <span className="ai-status ai-status-on"><Sparkles size={12} /> AI matching active</span>
            )}
            {aiResults && !aiResults.aiAvailable && (
              <span className="ai-status ai-status-off">AI matching not available for these fabrics yet — showing color-only results.</span>
            )}
            {aiError && <span className="ai-status ai-status-off">{aiError}</span>}
          </div>
        )}

        <label className="stock-filter">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          {t("stockOnlyFilter")}
        </label>
      </div>

      {best && (
        <div className={`best-match-banner ${best.score.cls}`}>
          <span className="best-match-swatch" style={{ background: best.product.hex }} />
          <span>
            {t("closestMatch")} <strong>{best.product.colorName}</strong> ({best.product.fabricType}) —{" "}
            <strong>{best.score.pct}% {t("matchWord")}</strong>, {t(best.score.labelKey).toLowerCase()}.
          </span>
        </div>
      )}

      <div className="match-results">
        <div className="match-results-head">
          <span>{t("colFabric")}</span>
          <span></span>
          <span>{t("colStock")}</span>
          <span>{t("colMatch")}</span>
          <span>{t("colPrice")}</span>
          <span></span>
        </div>
        {ranked.map(({ product, score }, i) => (
          <MatchResultRow key={product.id} product={product} score={score} mode={mode} onOpen={aiResults ? (p) => handleSelectMatch(p, i + 1) : onOpen} />
        ))}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(dataUrl) => setUploadedImg(dataUrl)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WHOLESALE ACCOUNT REQUEST — B2B signup. Structured address + GPS pin so
// deliveries always find the exact shop, not just a general area.
// ---------------------------------------------------------------------------

function emptyWholesaleForm() {
  return {
    businessName: "", ownerName: "", phone: "", password: "",
    address: { line: "", landmark: "", lat: null, lng: null },
  };
}

function WholesaleRequestForm({ onSubmitted }) {
  const { t } = useLang();
  const [form, setForm] = useState(emptyWholesaleForm());
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function setAddr(field, value) {
    setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));
  }

  function captureLocation() {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(t("geoUnavailable"));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAddr("lat", pos.coords.latitude);
        setAddr("lng", pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocError(t("geoFailed"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit() {
    if (!form.businessName || !form.ownerName || !form.phone || !form.password) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.wholesaleSignUp(form);
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setSubmitError(err.message === "phone_already_registered" ? t("phoneAlreadyRegistered") : t("signupFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="matcher">
        <div className="wholesale-confirm">
          <ShieldCheck size={32} />
          <h2>{t("requestSent")}</h2>
          <p>{t("requestSentBody", { name: form.businessName })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matcher">
      <div className="matcher-intro">
        <p className="eyebrow">{t("wholesaleEyebrow")}</p>
        <h1>{t("wholesaleFormTitle")}</h1>
        <p className="hero-sub">
          {t("wholesaleFormSub")}
        </p>
      </div>

      <div className="matcher-input-card wholesale-form">
        <h4><Building2 size={15} /> {t("businessDetails")}</h4>
        <div className="form-row">
          <label>{t("businessName")}
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder={t("businessNamePlaceholder")} />
          </label>
          <label>{t("ownerName")}
            <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder={t("fullName")} />
          </label>
        </div>
        <div className="form-row">
          <label>{t("phoneLabel")}
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+93 …" />
          </label>
          <label>{t("choosePassword")}
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("choosePasswordPlaceholder")} />
          </label>
        </div>

        <h4 style={{ marginTop: 8 }}><MapPin size={15} /> {t("shopAddress")}</h4>
        <label>{t("addressLine")}
          <input value={form.address.line} onChange={(e) => setAddr("line", e.target.value)} placeholder={t("addressLinePlaceholder")} />
        </label>
        <label>{t("landmark")} <span className="optional">{t("landmarkHint")}</span>
          <input value={form.address.landmark} onChange={(e) => setAddr("landmark", e.target.value)} placeholder={t("landmarkPlaceholder")} />
        </label>

        <div className="geo-capture">
          <button type="button" className="btn btn-ghost btn-sm" onClick={captureLocation} disabled={locating}>
            <MapPin size={14} /> {locating ? t("pinLocating") : form.address.lat ? t("pinRetake") : t("pinLocationBtn")}
          </button>
          {form.address.lat && (
            <span className="geo-confirmed"><Check size={13} /> {form.address.lat.toFixed(5)}, {form.address.lng.toFixed(5)}</span>
          )}
          {locError && <span className="geo-error">{locError}</span>}
          <p className="matcher-hint" style={{ marginTop: 8 }}>
            <Sparkles size={12} /> {t("geoHint")}
          </p>
        </div>

        {submitError && <p className="auth-error" style={{ marginTop: 12 }}>{submitError}</p>}

        <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ marginTop: 18 }}>
          {submitting ? <Loader2 size={15} className="spin" /> : null} {t("submitForReview")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WHOLESALE ACCOUNTS — admin approval queue
// ---------------------------------------------------------------------------

function WholesaleAccountCard({ account, onApprove, onReject, onDeleteRequest, canManage, busy }) {
  const { t } = useLang();
  const mapUrl = account.address.lat
    ? `https://www.google.com/maps?q=${account.address.lat},${account.address.lng}`
    : null;
  const statusKey = { pending: "statusPending", approved: "statusApproved", rejected: "statusRejected" }[account.status];

  return (
    <div className={`wholesale-card status-${account.status}`}>
      <div className="wholesale-card-top">
        <div>
          <h4>{account.businessName}</h4>
          <p className="wholesale-owner">{account.ownerName} · {account.phone}</p>
        </div>
        <span className={`status-pill status-${account.status}`}>
          {account.status === "pending" && <Clock size={12} />}
          {account.status === "approved" && <Check size={12} />}
          {account.status === "rejected" && <XCircle size={12} />}
          {t(statusKey)}
        </span>
      </div>

      <div className="wholesale-address">
        <MapPin size={14} />
        <div>
          <p>{account.address.line}{account.address.landmark ? `, ${account.address.landmark}` : ""}</p>
          {mapUrl ? (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="map-link">{t("openInMaps")} <ChevronRight size={12} /></a>
          ) : (
            <span className="no-pin">{t("noPinCaptured")}</span>
          )}
        </div>
      </div>

      {account.status === "pending" && !canManage && (
        <p className="staff-no-permission">{t("staffNoPermission")}</p>
      )}

      {account.status === "pending" && canManage && (
        <div className="wholesale-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onApprove(account.id)} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" /> : t("approveBtn")}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onReject(account.id)} disabled={busy}>{t("rejectBtn")}</button>
        </div>
      )}

      {/* Delete is available regardless of status (pending, approved, or
          rejected) — an owner may want to remove any of these, e.g. a
          rejected spam signup or a former buyer who's no longer a
          customer. Owner-only, same gate as approve/reject. */}
      {canManage && (
        <div className="wholesale-actions" style={{ marginTop: account.status === "pending" ? 6 : 12 }}>
          <button className="btn btn-danger btn-sm" onClick={() => onDeleteRequest(account)} disabled={busy}>
            <Trash2 size={13} /> {t("deleteAccountBtn")}
          </button>
        </div>
      )}
    </div>
  );
}

function WholesaleAdmin({ accounts, canManage, onApprove, onReject, onDelete, loading }) {
  const { t } = useLang();
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function approve(id) {
    setBusyId(id);
    try { await onApprove(id); } finally { setBusyId(null); }
  }
  async function reject(id) {
    setBusyId(id);
    try { await onReject(id); } finally { setBusyId(null); }
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> {t("loadingText")}</p>
      </div>
    );
  }

  const pending = accounts.filter((a) => a.status === "pending");
  const approved = accounts.filter((a) => a.status === "approved");
  const rejected = accounts.filter((a) => a.status === "rejected");

  return (
    <div className="admin">
      <div className="admin-stats">
        <div className="stat-card warn">
          <span className="stat-label">{t("pendingReview")}</span>
          <span className="stat-value">{pending.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t("approvedBuyers")}</span>
          <span className="stat-value">{approved.length}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">{t("rejected")}</span>
          <span className="stat-value">{rejected.length}</span>
        </div>
      </div>

      {pending.length > 0 && (
        <>
          <h3 className="section-title">{t("pendingRequests")}</h3>
          <div className="wholesale-grid">
            {pending.map((a) => (
              <WholesaleAccountCard key={a.id} account={a} onApprove={approve} onReject={reject} onDeleteRequest={setPendingDelete} canManage={canManage} busy={busyId === a.id} />
            ))}
          </div>
        </>
      )}

      <h3 className="section-title">{t("approvedBuyers")}</h3>
      <div className="wholesale-grid">
        {approved.map((a) => (
          <WholesaleAccountCard key={a.id} account={a} onApprove={approve} onReject={reject} onDeleteRequest={setPendingDelete} canManage={canManage} busy={busyId === a.id} />
        ))}
        {approved.length === 0 && <p className="empty-state">{t("noApprovedBuyers")}</p>}
      </div>

      {rejected.length > 0 && (
        <>
          <h3 className="section-title">{t("rejected")}</h3>
          <div className="wholesale-grid">
            {rejected.map((a) => (
              <WholesaleAccountCard key={a.id} account={a} onApprove={approve} onReject={reject} onDeleteRequest={setPendingDelete} canManage={canManage} busy={busyId === a.id} />
            ))}
          </div>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t("deleteWholesaleTitle")}
          body={t("deleteWholesaleBody", { name: pendingDelete.businessName })}
          confirmLabel={t("deleteConfirmBtn")}
          cancelLabel={t("cancelBtn")}
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONFIRM DIALOG — small centered modal for destructive actions (deleting a
// fabric, a supplier, a wholesale account, etc.) so a single accidental tap
// can never destroy data outright. Deliberately separate from the sliding
// `.drawer` used for forms — a confirmation is a quick yes/no, not a form,
// so it gets its own compact centered card instead.
// ---------------------------------------------------------------------------
function ConfirmDialog({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, busy, error }) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{body}</p>
        {error && <p className="form-error">{error}</p>}
        <div className="confirm-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" /> : null} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN VIEW
// ---------------------------------------------------------------------------

function AdminPanel({ products, loading, onAdd, onUpdate, onDelete, canEdit = true, canDelete = true }) {
  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // the product about to be deleted, or null
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  function emptyForm() {
    return { fabricType: "Cotton", colorName: "", hex: "#C9A29A", width: 44, gsm: 100, retailPrice: "", wholesalePrice: "", stockMeters: "", sku: "", photoUrl: "" };
  }

  function startAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(p) {
    if (!canEdit) return;
    setForm({ ...p });
    setEditingId(p.id);
    setSaveError(null);
    setShowForm(true);
  }

  async function save() {
    if (!form.colorName || !form.sku) return;
    if (editingId && !canEdit) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        width: Number(form.width),
        gsm: Number(form.gsm),
        retailPrice: Number(form.retailPrice),
        wholesalePrice: Number(form.wholesalePrice),
        // Meters in stock can be fractional (e.g. 45.5m off a bolt), so this
        // is a plain float, not rounded to a whole number.
        stockMeters: Number(form.stockMeters),
      };
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onAdd(payload);
      }
      setShowForm(false);
    } catch (err) {
      // Previously a failed save (e.g. a permissions error, or a stock
      // value the database rejected) failed silently — the drawer just sat
      // there with no feedback and nothing changed. Surface it instead.
      setSaveError(err?.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function requestRemove(product) {
    if (!canDelete) return;
    setDeleteError(null);
    setPendingDelete(product);
  }

  async function confirmRemove() {
    if (!pendingDelete || !canDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err?.message || "Could not delete this item. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const totalMeters = products.reduce((sum, p) => sum + Number(p.stockMeters || 0), 0);
  const lowStock = products.filter((p) => p.stockMeters > 0 && p.stockMeters < 20).length;
  const outStock = products.filter((p) => p.stockMeters === 0).length;

  if (loading) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> {t("loadingText")}</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">{t("totalSkus")}</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t("metersInStock")}</span>
          <span className="stat-value">{totalMeters.toLocaleString()}m</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">{t("lowStockLabel")}</span>
          <span className="stat-value">{lowStock}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">{t("outOfStockLabel")}</span>
          <span className="stat-value">{outStock}</span>
        </div>
      </div>

      <div className="admin-toolbar">
        <h3>{t("inventory")}</h3>
        <button className="btn btn-primary" onClick={startAdd}><Plus size={15} /> {t("addFabric")}</button>
      </div>

      {!canEdit && !canDelete && (
        <p className="dim" style={{ fontSize: "0.82rem", marginTop: -4, marginBottom: 12 }}>
          Your account can add new fabrics, but only the owner can edit or delete existing inventory items.
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t("tableColor")}</th>
              <th>{t("tableFabric")}</th>
              <th>{t("tableSku")}</th>
              <th>{t("tableWidth")}</th>
              <th>{t("tableRetail")}</th>
              <th>{t("tableWholesale")}</th>
              <th>{t("tableStock")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><span className="table-swatch" style={{ background: p.hex }} /></td>
                <td>{p.colorName}</td>
                <td>{p.fabricType}</td>
                <td className="mono">{p.sku}</td>
                <td>{p.width}"</td>
                <td>{CURRENCY_SYMBOL}{p.retailPrice}</td>
                <td>{CURRENCY_SYMBOL}{p.wholesalePrice}</td>
                <td><StockBadge meters={Number(p.stockMeters)} /></td>
                <td className="row-actions">
                  {canEdit && (
                    <button onClick={() => startEdit(p)}><Pencil size={14} /></button>
                  )}
                  {canDelete && (
                    <button onClick={() => requestRemove(p)} aria-label={t("deleteConfirmBtn")}><Trash2 size={14} /></button>
                  )}
                  {!canEdit && !canDelete && <span className="dim" style={{ fontSize: "0.78rem" }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="drawer-backdrop" onClick={() => setShowForm(false)}>
          <div className="drawer form-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h2>{editingId ? t("editFabric") : t("addFabricTitle")}</h2>

            <label>{t("fabricType")}
              <select value={form.fabricType} onChange={(e) => setForm({ ...form, fabricType: e.target.value })}>
                {FABRIC_TYPES.map((ft) => <option key={ft}>{ft}</option>)}
              </select>
            </label>

            <label>{t("colorName")}
              <input value={form.colorName} onChange={(e) => setForm({ ...form, colorName: e.target.value })} placeholder={t("colorNamePlaceholder")} />
            </label>

            <label>{t("swatchColor")}
              <input type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
            </label>

            <label>{t("skuLabel")}
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder={t("skuPlaceholder")} />
            </label>

            <div className="form-row">
              <label>{t("widthIn")}
                <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              </label>
              <label>{t("gsmLabel")}
                <input type="number" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
              </label>
            </div>

            <div className="form-row">
              <label>{t("retailPricePerM")}
                <input type="number" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} />
              </label>
              <label>{t("wholesalePricePerM")}
                <input type="number" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} />
              </label>
            </div>

            <label>{t("stockMeters")}
              <input type="number" value={form.stockMeters} onChange={(e) => setForm({ ...form, stockMeters: e.target.value })} />
            </label>

            <FabricPhotoField
              photoUrl={form.photoUrl}
              onPhotoChange={(url) => setForm({ ...form, photoUrl: url })}
              fabricId={editingId}
            />

            {saveError && <p className="form-error">{saveError}</p>}
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? <Loader2 size={15} className="spin" /> : null} {editingId ? t("saveChanges") : t("addToInventory")}
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t("deleteFabricTitle")}
          body={t("deleteFabricBody", { name: `${pendingDelete.colorName} — ${pendingDelete.fabricType}` })}
          confirmLabel={t("deleteConfirmBtn")}
          cancelLabel={t("cancelBtn")}
          busy={deleting}
          error={deleteError}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FABRIC PHOTO FIELD (Phase 6) — upload a real product photo (separate
// from the hex swatch color), and, once the fabric is saved, trigger AI
// embedding generation for it. Embedding is only offered for an already-
// saved fabric (needs a fabricId to attach the embedding to) and only in
// Supabase mode (local mode has no server to run inference on — see
// api.embedFabricPhoto's local-mode implementation).
// ---------------------------------------------------------------------------
function FabricPhotoField({ photoUrl, onPhotoChange, fabricId }) {
  const [uploading, setUploading] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [embedResult, setEmbedResult] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadFabricPhoto(file, fabricId || "new");
      onPhotoChange(url);
    } catch (err) {
      alert("Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleEmbed() {
    setEmbedding(true);
    setEmbedResult(null);
    try {
      await api.embedFabricPhoto(fabricId);
      setEmbedResult({ ok: true });
    } catch (err) {
      setEmbedResult({ ok: false, message: err.message });
    } finally {
      setEmbedding(false);
    }
  }

  return (
    <div className="fabric-photo-field">
      <label>Fabric photo (for AI matching — separate from the swatch color above)
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </label>
      {uploading && <p className="dim" style={{ fontSize: "0.8rem" }}><Loader2 size={13} className="spin" /> Uploading…</p>}
      {photoUrl && <img src={photoUrl} alt="Fabric" className="fabric-photo-preview" />}

      {photoUrl && fabricId && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleEmbed} disabled={embedding}>
            {embedding ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Generate AI embedding
          </button>
          {embedResult?.ok && <p className="dim" style={{ fontSize: "0.78rem", marginTop: 4 }}><Check size={12} /> Embedded — this fabric will now use AI matching.</p>}
          {embedResult && !embedResult.ok && <p className="form-error">{embedResult.message}</p>}
        </div>
      )}
      {photoUrl && !fabricId && (
        <p className="dim" style={{ fontSize: "0.78rem", marginTop: 4 }}>Save this fabric first, then reopen it to generate an AI embedding.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RECORD SALE — staff-entered record of a completed, paid transaction.
// This is the only way sales data enters the system (Phase 1 decision: the
// WhatsApp order flow reflects intent to order, not a confirmed sale, so it
// does not auto-record — see README Roadmap). Cost is resolved server-side
// (FIFO across stock batches) so the merchant doesn't need to think about
// batches; they just pick a fabric, meters, and price.
// ---------------------------------------------------------------------------
function RecordSaleForm({ products, currentUser, onRecorded }) {
  const [lines, setLines] = useState([{ fabricId: "", meters: "", unitPrice: "" }]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [discountTotal, setDiscountTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [formError, setFormError] = useState(null);

  function updateLine(idx, updates) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...updates } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { fabricId: "", meters: "", unitPrice: "" }]);
  }

  function removeLine(idx) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  // Pre-fill unit price with the fabric's list price when it's picked, so
  // staff only need to change it for a negotiated/discounted price.
  function handleFabricPick(idx, fabricId) {
    const product = products.find((p) => p.id === fabricId);
    updateLine(idx, {
      fabricId,
      unitPrice: product ? String(product.retailPrice) : "",
    });
  }

  const validLines = lines.filter((l) => l.fabricId && Number(l.meters) > 0 && l.unitPrice !== "");
  const subtotal = validLines.reduce((sum, l) => sum + Number(l.meters) * Number(l.unitPrice), 0);
  const total = Math.max(0, subtotal - Number(discountTotal || 0));

  async function handleSubmit() {
    setFormError(null);
    if (validLines.length === 0) {
      setFormError("Add at least one fabric, meters, and price.");
      return;
    }
    setSaving(true);
    try {
      const sale = await api.recordSale({
        warehouseId: "wh1", // single-warehouse for now — see README Roadmap
        salespersonId: currentUser?.id,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        paymentMethod,
        paymentStatus,
        discountTotal: Number(discountTotal || 0),
        notes: notes || null,
        items: validLines.map((l) => ({
          fabricId: l.fabricId,
          meters: Number(l.meters),
          unitPrice: Number(l.unitPrice),
        })),
      });
      setLastInvoice(sale.invoiceNumber || sale.invoice_number);
      setLines([{ fabricId: "", meters: "", unitPrice: "" }]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountTotal("");
      setNotes("");
      onRecorded?.();
    } catch (err) {
      setFormError("Could not record the sale. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin">
      <div className="admin-toolbar">
        <h3>Record Sale</h3>
      </div>

      {lastInvoice && (
        <div className="sale-confirm">
          <Check size={15} /> Recorded as <strong>{lastInvoice}</strong>
        </div>
      )}

      <div className="table-wrap" style={{ padding: 18 }}>
        {lines.map((line, idx) => {
          const product = products.find((p) => p.id === line.fabricId);
          return (
            <div className="sale-line" key={idx}>
              <select value={line.fabricId} onChange={(e) => handleFabricPick(idx, e.target.value)}>
                <option value="">Select fabric…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.colorName} — {p.fabricType} ({p.sku}) · {p.stockMeters}m in stock
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Meters"
                value={line.meters}
                onChange={(e) => updateLine(idx, { meters: e.target.value })}
                style={{ width: 90 }}
              />
              <input
                type="number"
                placeholder="Price/m"
                value={line.unitPrice}
                onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                style={{ width: 100 }}
              />
              {product && line.meters && Number(line.meters) > product.stockMeters && (
                <span className="sale-line-warn">only {product.stockMeters}m in stock</span>
              )}
              {lines.length > 1 && (
                <button className="icon-btn" onClick={() => removeLine(idx)}><Trash2 size={14} /></button>
              )}
            </div>
          );
        })}
        <button className="btn btn-ghost btn-sm" onClick={addLine} style={{ marginTop: 8 }}>
          <Plus size={14} /> Add another fabric
        </button>
      </div>

      <div className="form-row" style={{ marginTop: 18 }}>
        <label>Customer name (optional)
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <label>Customer phone (optional)
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </label>
      </div>

      <div className="form-row">
        <label>Payment method
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>Payment status
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>
      </div>

      <label>Discount total ({CURRENCY_SYMBOL})
        <input type="number" value={discountTotal} onChange={(e) => setDiscountTotal(e.target.value)} style={{ maxWidth: 160 }} />
      </label>

      <label>Notes (optional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="sale-total">
        <span>Subtotal: {CURRENCY_SYMBOL}{subtotal.toLocaleString()}</span>
        <span className="sale-total-final">Total: {CURRENCY_SYMBOL}{total.toLocaleString()}</span>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: 12 }}>
        {saving ? <Loader2 size={15} className="spin" /> : null} Record Sale
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DASHBOARD — Phase 1 business intelligence. All aggregation happens here in
// the app layer from raw sales/sale_items/stock_batches/fabrics rows (see
// api.fetchDashboardMetrics) rather than in SQL views — simpler to read and
// fast enough at single-shop data volumes. If this ever needs to scale to
// many shops or years of history, move the heavy aggregations into SQL.
// ---------------------------------------------------------------------------
function Dashboard({ products }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockThreshold] = useState(20);
  const [deadStockDays] = useState(90);

  useEffect(() => {
    api.fetchDashboardMetrics().then(setData).finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;
    const { sales, saleItems, batches, fabrics } = data;

    const saleById = Object.fromEntries(sales.map((s) => [s.id, s]));
    const fabricById = Object.fromEntries(fabrics.map((f) => [f.id, f]));

    function itemDate(item) {
      const sale = saleById[item.saleId || item.sale_id];
      return sale ? new Date(sale.soldAt || sale.sold_at) : null;
    }
    function itemRevenue(item) {
      return Number(item.meters) * Number(item.unitPrice ?? item.unit_price) - Number(item.discount || 0);
    }
    function itemCost(item) {
      return Number(item.meters) * Number(item.unitCost ?? item.unit_cost);
    }
    function itemProfit(item) {
      return itemRevenue(item) - itemCost(item);
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    function sumSince(since) {
      const items = saleItems.filter((i) => {
        const d = itemDate(i);
        return d && d >= since;
      });
      return {
        revenue: items.reduce((s, i) => s + itemRevenue(i), 0),
        profit: items.reduce((s, i) => s + itemProfit(i), 0),
        count: new Set(items.map((i) => i.saleId || i.sale_id)).size,
      };
    }

    const today = sumSince(startOfDay);
    const week = sumSince(startOfWeek);
    const month = sumSince(startOfMonth);
    const year = sumSince(startOfYear);

    const totalRevenue = saleItems.reduce((s, i) => s + itemRevenue(i), 0);
    const totalProfit = saleItems.reduce((s, i) => s + itemProfit(i), 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgInvoiceValue = sales.length > 0 ? totalRevenue / sales.length : 0;

    const inventoryValuation = batches.reduce(
      (s, b) => s + Number(b.metersRemaining ?? b.meters_remaining) * Number(b.costPerMeter ?? b.cost_per_meter),
      0
    );

    // Per-fabric rollups for best-sellers / dead stock / reorder.
    const perFabric = {};
    for (const item of saleItems) {
      const fid = item.fabricId || item.fabric_id;
      if (!perFabric[fid]) perFabric[fid] = { metersSold: 0, revenue: 0, profit: 0, lastSaleDate: null };
      perFabric[fid].metersSold += Number(item.meters);
      perFabric[fid].revenue += itemRevenue(item);
      perFabric[fid].profit += itemProfit(item);
      const d = itemDate(item);
      if (d && (!perFabric[fid].lastSaleDate || d > perFabric[fid].lastSaleDate)) {
        perFabric[fid].lastSaleDate = d;
      }
    }

    const bestSellers = Object.entries(perFabric)
      .map(([fid, stats]) => ({ fabric: fabricById[fid], ...stats }))
      .filter((r) => r.fabric)
      .sort((a, b) => b.metersSold - a.metersSold)
      .slice(0, 8);

    const mostProfitable = [...bestSellers].sort((a, b) => b.profit - a.profit).slice(0, 8);

    const deadStockCutoff = new Date(now);
    deadStockCutoff.setDate(now.getDate() - deadStockDays);
    const deadStock = products.filter((p) => {
      if (Number(p.stockMeters) <= 0) return false;
      const stats = perFabric[p.id];
      if (!stats || !stats.lastSaleDate) return true; // never sold at all
      return stats.lastSaleDate < deadStockCutoff;
    });

    const lowStock = products.filter((p) => Number(p.stockMeters) > 0 && Number(p.stockMeters) < lowStockThreshold);
    const outOfStock = products.filter((p) => Number(p.stockMeters) === 0);

    // Count open customer requests per fabric (by fabric_id when linked, or
    // by normalized type+color when not) so unmet demand can boost reorder
    // priority — a product with no sales history but active customer
    // requests is still worth reordering, which sales velocity alone
    // would miss.
    const openRequests = data.openRequests || [];
    function requestCountFor(product) {
      const norm = (s) => (s || "").trim().toLowerCase();
      return openRequests
        .filter((r) => {
          const rFabricId = r.fabricId ?? r.fabric_id;
          if (rFabricId) return rFabricId === product.id;
          const rType = norm(r.fabricType ?? r.fabric_type);
          const rColor = norm(r.colorName ?? r.color_name);
          return rType === norm(product.fabricType) && rColor === norm(product.colorName);
        })
        .reduce((s, r) => s + (r.requestCount ?? r.request_count ?? 1), 0);
    }

    // Reorder suggestions: low or out of stock, ranked by sales velocity
    // plus unmet customer demand — a low-stock item nobody buys and nobody
    // asks for isn't urgent; one with open customer requests is, even with
    // thin sales history.
    const reorderCandidates = [...lowStock, ...outOfStock]
      .map((p) => {
        const requestCount = requestCountFor(p);
        return {
          product: p,
          metersSold: perFabric[p.id]?.metersSold || 0,
          requestCount,
          priorityScore: (perFabric[p.id]?.metersSold || 0) + requestCount * 10, // customer request weighted higher: explicit unmet demand vs inferred velocity
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10);

    // Last 14 days, for the trend chart.
    const dailySeries = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(startOfDay);
      day.setDate(startOfDay.getDate() - i);
      const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
      const dayItems = saleItems.filter((it) => {
        const d = itemDate(it);
        return d && d >= day && d < nextDay;
      });
      dailySeries.push({
        label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        revenue: dayItems.reduce((s, i) => s + itemRevenue(i), 0),
      });
    }

    return {
      today, week, month, year,
      totalRevenue, totalProfit, profitMargin, avgInvoiceValue,
      inventoryValuation, bestSellers, mostProfitable, deadStock, lowStock, outOfStock,
      reorderCandidates, dailySeries,
      activeCustomers: new Set(sales.map((s) => s.customerPhone || s.customer_phone).filter(Boolean)).size,
    };
  }, [data, products, lowStockThreshold, deadStockDays]);

  if (loading || !metrics) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <InsightsPanel data={data} products={products} />

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">Today's revenue</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{metrics.today.revenue.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This week</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{metrics.week.revenue.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This month</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{metrics.month.revenue.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This year</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{metrics.year.revenue.toLocaleString()}</span>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">Total profit</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{metrics.totalProfit.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Profit margin</span>
          <span className="stat-value">{metrics.profitMargin.toFixed(1)}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. invoice value</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(metrics.avgInvoiceValue).toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Inventory valuation</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(metrics.inventoryValuation).toLocaleString()}</span>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">Active customers</span>
          <span className="stat-value">{metrics.activeCustomers}</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Low stock</span>
          <span className="stat-value">{metrics.lowStock.length}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">Out of stock</span>
          <span className="stat-value">{metrics.outOfStock.length}</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">Dead stock ({deadStockDays}d)</span>
          <span className="stat-value">{metrics.deadStock.length}</span>
        </div>
      </div>

      <ChartBlock title="Revenue — last 14 days" series={metrics.dailySeries} />

      <div className="dash-columns">
        <RankedList
          title="Best-selling fabrics (meters sold)"
          rows={metrics.bestSellers}
          renderRow={(r) => (
            <>
              <span>{r.fabric.colorName} <span className="dim">— {r.fabric.fabricType}</span></span>
              <span className="mono">{r.metersSold.toLocaleString()}m</span>
            </>
          )}
        />
        <RankedList
          title="Most profitable fabrics"
          rows={metrics.mostProfitable}
          renderRow={(r) => (
            <>
              <span>{r.fabric.colorName} <span className="dim">— {r.fabric.fabricType}</span></span>
              <span className="mono">{CURRENCY_SYMBOL}{Math.round(r.profit).toLocaleString()}</span>
            </>
          )}
        />
      </div>

      <div className="dash-columns">
        <RankedList
          title="Reorder suggestions"
          rows={metrics.reorderCandidates}
          empty="Nothing urgently needs reordering."
          renderRow={(r) => (
            <>
              <span>{r.product.colorName} <span className="dim">— {r.product.fabricType}</span></span>
              <span className="mono">
                {r.product.stockMeters}m left · {r.metersSold}m sold
                {r.requestCount > 0 ? ` · ${r.requestCount} requested` : ""}
              </span>
            </>
          )}
        />
        <RankedList
          title={`Dead stock (no sale in ${deadStockDays}+ days)`}
          rows={metrics.deadStock}
          empty="No dead stock right now."
          renderRow={(p) => (
            <>
              <span>{p.colorName} <span className="dim">— {p.fabricType}</span></span>
              <span className="mono">{p.stockMeters}m</span>
            </>
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// INSIGHTS PANEL (Phase 7) — natural-language summary at the top of the
// Dashboard. Facts are computed by buildInsightFacts() (pure arithmetic,
// already tested via Phases 1/5's own math) and only PHRASED by an LLM —
// see insightFacts.js and generate-insights/index.ts for why that split
// matters. If there's no LLM configured, or it fails, or there's simply
// nothing to say yet (a young shop with little sales history), this shows
// the plain facts (or an honest "not enough data yet" message) rather
// than hiding the section or presenting placeholder confidence.
// ---------------------------------------------------------------------------
function InsightsPanel({ data, products }) {
  const [state, setState] = useState({ loading: true, insights: [], aiPhrased: false, error: null });

  useEffect(() => {
    if (!data) return;
    const facts = buildInsightFacts({ sales: data.sales, saleItems: data.saleItems, fabrics: data.fabrics, products });
    if (facts.length === 0) {
      setState({ loading: false, insights: [], aiPhrased: false, error: null });
      return;
    }
    api.generateInsights(facts).then((result) => {
      setState({ loading: false, insights: result.insights, aiPhrased: result.aiPhrased, error: result.error || null });
    });
  }, [data, products]);

  if (state.loading) {
    return (
      <div className="insights-panel">
        <p className="dim" style={{ fontSize: "0.85rem" }}><Loader2 size={13} className="spin" /> Building insights…</p>
      </div>
    );
  }

  if (state.insights.length === 0) {
    return (
      <div className="insights-panel insights-empty">
        <Sparkles size={14} />
        <span>Not enough sales history yet for insights to be meaningful — this fills in automatically as more sales are recorded.</span>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <Sparkles size={14} />
        <span>Insights</span>
        {!state.aiPhrased && <span className="ai-status ai-status-off">plain summary — AI phrasing not available</span>}
      </div>
      <ul className="insights-list">
        {state.insights.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TRENDS — Phase 5: seasonal comparisons and simple forecasting.
//
// This shop just went live with real sales tracking (Phases 1-4), so there
// is little to no real history yet. Rather than wait to build this, the
// screen is built now and designed to say so honestly — every comparison
// checks whether there's enough data first, and shows a clear "not enough
// history yet" state instead of a misleading 0% or empty chart. It fills
// in naturally as real sales accumulate.
//
// Forecasting is a simple moving average / trend, not ML — consistent with
// keeping this phase rule-based and explainable. A forecast only renders
// once there are at least MIN_WEEKS_FOR_FORECAST weeks of sales; before
// that it explains what's missing rather than guessing.
//
// Season boundaries are fixed Northern Hemisphere calendar quarters
// (Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov fall) — a
// reasonable default for this shop's location (Kabul), not a universal
// truth. Adjust SEASON_MONTHS below if that's wrong for how this business
// actually experiences seasons (e.g. Ramadan/Eid/wedding-season demand
// mentioned in the original spec don't line up with fixed calendar
// seasons at all, since Ramadan shifts each year — that's a separate,
// harder problem than calendar seasons and isn't attempted here).
// ---------------------------------------------------------------------------
const SEASON_MONTHS = {
  Winter: [11, 0, 1],  // Dec, Jan, Feb
  Spring: [2, 3, 4],
  Summer: [5, 6, 7],
  Fall: [8, 9, 10],
};
const MIN_WEEKS_FOR_FORECAST = 6;

function seasonOf(date) {
  const month = date.getMonth();
  return Object.entries(SEASON_MONTHS).find(([, months]) => months.includes(month))?.[0] || "Unknown";
}

function pctChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null; // null = not a meaningful percentage (division by zero)
  return ((current - previous) / previous) * 100;
}

function Trends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasonFabricType, setSeasonFabricType] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  useEffect(() => {
    api.fetchDashboardMetrics().then(setData).finally(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => {
    if (!data) return null;
    const { sales, saleItems, fabrics } = data;
    const saleById = Object.fromEntries(sales.map((s) => [s.id, s]));
    const fabricById = Object.fromEntries(fabrics.map((f) => [f.id, f]));

    function itemDate(item) {
      const sale = saleById[item.saleId || item.sale_id];
      return sale ? new Date(sale.soldAt || sale.sold_at) : null;
    }
    function itemRevenue(item) {
      return Number(item.meters) * Number(item.unitPrice ?? item.unit_price) - Number(item.discount || 0);
    }

    const now = new Date();

    // This month vs last month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthRevenue = saleItems.filter((i) => itemDate(i) >= startOfThisMonth).reduce((s, i) => s + itemRevenue(i), 0);
    const lastMonthRevenue = saleItems.filter((i) => { const d = itemDate(i); return d >= startOfLastMonth && d < startOfThisMonth; }).reduce((s, i) => s + itemRevenue(i), 0);

    // This year vs last year
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const thisYearRevenue = saleItems.filter((i) => itemDate(i) >= startOfThisYear).reduce((s, i) => s + itemRevenue(i), 0);
    const lastYearRevenue = saleItems.filter((i) => { const d = itemDate(i); return d >= startOfLastYear && d < startOfThisYear; }).reduce((s, i) => s + itemRevenue(i), 0);

    // Earliest sale date, to judge how much history actually exists.
    const allDates = saleItems.map(itemDate).filter(Boolean);
    const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : null;
    const daysOfHistory = earliestDate ? Math.floor((now - earliestDate) / (1000 * 60 * 60 * 24)) : 0;

    // Season breakdown: revenue and top fabric type per season, across all
    // history (not just this year, since a young shop needs to pool
    // whatever seasons it's actually seen so far).
    const bySeasonRevenue = { Winter: 0, Spring: 0, Summer: 0, Fall: 0 };
    const bySeasonFabricType = { Winter: {}, Spring: {}, Summer: {}, Fall: {} };
    for (const item of saleItems) {
      const d = itemDate(item);
      if (!d) continue;
      const season = seasonOf(d);
      bySeasonRevenue[season] += itemRevenue(item);
      const fabric = fabricById[item.fabricId ?? item.fabric_id];
      if (fabric) {
        const key = seasonFabricType ? fabric.colorName : fabric.fabricType;
        if (seasonFabricType && fabric.fabricType !== seasonFabricType) continue;
        bySeasonFabricType[season][key] = (bySeasonFabricType[season][key] || 0) + Number(item.meters);
      }
    }
    const seasonTopSeller = {};
    for (const season of Object.keys(bySeasonFabricType)) {
      const entries = Object.entries(bySeasonFabricType[season]).sort((a, b) => b[1] - a[1]);
      seasonTopSeller[season] = entries[0] || null;
    }

    // Weekly revenue series for the forecast, last 16 weeks.
    const weeklyRevenue = [];
    for (let i = 15; i >= 0; i--) {
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
      const revenue = saleItems.filter((it) => { const d = itemDate(it); return d && d >= weekStart && d < weekEnd; }).reduce((s, i) => s + itemRevenue(i), 0);
      weeklyRevenue.push({ label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }), revenue });
    }
    const weeksWithSales = weeklyRevenue.filter((w) => w.revenue > 0).length;

    // Simple forecast: exponential smoothing (alpha=0.3) over recent weeks,
    // projected forward one week. Deliberately simple and explainable —
    // not a model, just a weighted average that favors recent weeks.
    let forecast = null;
    if (weeksWithSales >= MIN_WEEKS_FOR_FORECAST) {
      const alpha = 0.3;
      let smoothed = weeklyRevenue[0].revenue;
      for (let i = 1; i < weeklyRevenue.length; i++) {
        smoothed = alpha * weeklyRevenue[i].revenue + (1 - alpha) * smoothed;
      }
      forecast = Math.round(smoothed);
    }

    return {
      thisMonthRevenue, lastMonthRevenue,
      thisYearRevenue, lastYearRevenue,
      daysOfHistory, earliestDate,
      bySeasonRevenue, seasonTopSeller,
      weeklyRevenue, weeksWithSales, forecast,
    };
  }, [data, seasonFabricType]);

  const fabricTypes = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.fabrics.map((f) => f.fabricType))].sort();
  }, [data]);

  // Custom date-range trending — same underlying sale-items data as the
  // three fixed comparisons above, just filtered to whatever range the
  // user picks instead of "this month" / "this year" / "next week".
  // Kept as its own useMemo (rather than folded into `analysis`) since it
  // only needs to recompute when the range actually changes, not on every
  // render that touches `analysis`.
  const rangeAnalysis = useMemo(() => {
    if (!data || !rangeStart || !rangeEnd) return null;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    end.setHours(23, 59, 59, 999); // inclusive of the whole end day
    if (start > end) return null;

    const { sales, saleItems, fabrics } = data;
    const saleById = Object.fromEntries(sales.map((s) => [s.id, s]));
    const fabricById = Object.fromEntries(fabrics.map((f) => [f.id, f]));
    function itemDate(item) {
      const sale = saleById[item.saleId || item.sale_id];
      return sale ? new Date(sale.soldAt || sale.sold_at) : null;
    }
    function itemRevenue(item) {
      return Number(item.meters) * Number(item.unitPrice ?? item.unit_price) - Number(item.discount || 0);
    }

    const itemsInRange = saleItems.filter((it) => {
      const d = itemDate(it);
      return d && d >= start && d <= end;
    });

    const revenue = itemsInRange.reduce((s, i) => s + itemRevenue(i), 0);
    const metersSold = itemsInRange.reduce((s, i) => s + Number(i.meters), 0);
    const saleIds = new Set(itemsInRange.map((i) => i.saleId || i.sale_id));

    const byFabric = {}; // fabricId -> { fabric, meters, revenue }
    for (const item of itemsInRange) {
      const fabric = fabricById[item.fabricId ?? item.fabric_id];
      if (!fabric) continue;
      const key = fabric.id;
      if (!byFabric[key]) byFabric[key] = { fabric, meters: 0, revenue: 0 };
      byFabric[key].meters += Number(item.meters);
      byFabric[key].revenue += itemRevenue(item);
    }
    const topFabrics = Object.values(byFabric).sort((a, b) => b.meters - a.meters).slice(0, 10);

    const byFabricType = {};
    for (const item of itemsInRange) {
      const fabric = fabricById[item.fabricId ?? item.fabric_id];
      if (!fabric) continue;
      byFabricType[fabric.fabricType] = (byFabricType[fabric.fabricType] || 0) + Number(item.meters);
    }
    const topFabricTypes = Object.entries(byFabricType).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    return { revenue, metersSold, saleCount: saleIds.size, topFabrics, topFabricTypes, days, itemCount: itemsInRange.length };
  }, [data, rangeStart, rangeEnd]);

  if (loading || !analysis) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading trends…</p>
      </div>
    );
  }

  const monthChange = pctChange(analysis.thisMonthRevenue, analysis.lastMonthRevenue);
  const yearChange = pctChange(analysis.thisYearRevenue, analysis.lastYearRevenue);
  const hasEnoughHistoryForYoY = analysis.daysOfHistory >= 395; // a year + a bit of buffer, so "last year" actually means something

  return (
    <div className="admin">
      {analysis.daysOfHistory < 30 && (
        <div className="history-notice">
          <Clock size={14} />
          {analysis.earliestDate
            ? `Only ${analysis.daysOfHistory} day${analysis.daysOfHistory === 1 ? "" : "s"} of sales history so far (since ${analysis.earliestDate.toLocaleDateString()}). Comparisons below will get more meaningful as more sales are recorded.`
            : "No sales recorded yet — comparisons and forecasts will appear here once Record Sale has been used."}
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">This month vs last month</span>
          <span className="stat-value">
            {monthChange === null ? "—" : `${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(0)}%`}
          </span>
          <span className="dim" style={{ fontSize: "0.72rem" }}>
            {CURRENCY_SYMBOL}{Math.round(analysis.thisMonthRevenue).toLocaleString()} vs {CURRENCY_SYMBOL}{Math.round(analysis.lastMonthRevenue).toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This year vs last year</span>
          <span className="stat-value">
            {!hasEnoughHistoryForYoY ? "—" : yearChange === null ? "—" : `${yearChange >= 0 ? "+" : ""}${yearChange.toFixed(0)}%`}
          </span>
          <span className="dim" style={{ fontSize: "0.72rem" }}>
            {hasEnoughHistoryForYoY
              ? `${CURRENCY_SYMBOL}${Math.round(analysis.thisYearRevenue).toLocaleString()} vs ${CURRENCY_SYMBOL}${Math.round(analysis.lastYearRevenue).toLocaleString()}`
              : "needs a year+ of history"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Next week forecast</span>
          <span className="stat-value">
            {analysis.forecast === null ? "—" : `${CURRENCY_SYMBOL}${analysis.forecast.toLocaleString()}`}
          </span>
          <span className="dim" style={{ fontSize: "0.72rem" }}>
            {analysis.forecast === null
              ? `needs ${MIN_WEEKS_FOR_FORECAST}+ weeks with sales (${analysis.weeksWithSales} so far)`
              : "simple trend estimate, not a guarantee"}
          </span>
        </div>
      </div>

      <ChartBlock title="Weekly revenue — last 16 weeks" series={analysis.weeklyRevenue} />

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <div className="admin-toolbar" style={{ marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>Revenue by season (all-time)</h4>
          <select value={seasonFabricType} onChange={(e) => setSeasonFabricType(e.target.value)}>
            <option value="">Top fabric type per season</option>
            {fabricTypes.map((t) => <option key={t} value={t}>Top colors in {t}</option>)}
          </select>
        </div>
        <div className="season-grid">
          {Object.entries(analysis.bySeasonRevenue).map(([season, revenue]) => (
            <div className="season-card" key={season}>
              <span className="season-name">{season}</span>
              <span className="season-revenue">{CURRENCY_SYMBOL}{Math.round(revenue).toLocaleString()}</span>
              {analysis.seasonTopSeller[season] ? (
                <span className="dim" style={{ fontSize: "0.75rem" }}>
                  top: {analysis.seasonTopSeller[season][0]} ({Math.round(analysis.seasonTopSeller[season][1])}m)
                </span>
              ) : (
                <span className="dim" style={{ fontSize: "0.75rem" }}>no sales yet</span>
              )}
            </div>
          ))}
        </div>
        <p className="dim" style={{ fontSize: "0.75rem", marginTop: 10 }}>
          Uses fixed calendar seasons (Dec–Feb winter, Mar–May spring,
          Jun–Aug summer, Sep–Nov fall) as a starting point — not aligned to
          demand-driving events like Ramadan or Eid, which shift dates each
          year and would need a separate calendar to track properly.
        </p>
      </div>

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <div className="admin-toolbar" style={{ marginBottom: 4 }}>
          <h4 style={{ margin: 0 }}>Custom date range</h4>
        </div>
        <p className="dim" style={{ fontSize: "0.8rem", marginTop: 0, marginBottom: 12 }}>
          Pick any two dates to see what was trending in between — alongside
          the three fixed comparisons above, not replacing them.
        </p>
        <div className="date-range-picker">
          <label>From
            <input type="date" value={rangeStart} max={rangeEnd || undefined} onChange={(e) => setRangeStart(e.target.value)} />
          </label>
          <label>To
            <input type="date" value={rangeEnd} min={rangeStart || undefined} onChange={(e) => setRangeEnd(e.target.value)} />
          </label>
        </div>

        {rangeStart && rangeEnd && !rangeAnalysis && (
          <p className="auth-error" style={{ marginTop: 12 }}>"From" needs to be before "To".</p>
        )}

        {rangeAnalysis && (
          <>
            <div className="admin-stats" style={{ marginTop: 16 }}>
              <div className="stat-card">
                <span className="stat-label">Revenue in range</span>
                <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(rangeAnalysis.revenue).toLocaleString()}</span>
                <span className="dim" style={{ fontSize: "0.72rem" }}>
                  {rangeAnalysis.days} day{rangeAnalysis.days === 1 ? "" : "s"} · {rangeAnalysis.saleCount} sale{rangeAnalysis.saleCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Meters sold</span>
                <span className="stat-value">{Math.round(rangeAnalysis.metersSold).toLocaleString()}m</span>
                <span className="dim" style={{ fontSize: "0.72rem" }}>across {rangeAnalysis.topFabrics.length} fabric{rangeAnalysis.topFabrics.length === 1 ? "" : "s"}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg. revenue / day</span>
                <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(rangeAnalysis.revenue / rangeAnalysis.days).toLocaleString()}</span>
              </div>
            </div>

            {rangeAnalysis.itemCount === 0 ? (
              <p className="empty-state">No sales recorded in this date range.</p>
            ) : (
              <div className="two-col-grid" style={{ marginTop: 4 }}>
                <RankedList
                  title="Top fabrics in this range (by meters)"
                  rows={rangeAnalysis.topFabrics}
                  renderRow={(row) => (
                    <>
                      <span className="table-swatch" style={{ background: row.fabric.hex }} />
                      <span style={{ flex: 1 }}>{row.fabric.colorName} — {row.fabric.fabricType}</span>
                      <span className="mono">{Math.round(row.meters)}m</span>
                    </>
                  )}
                />
                <RankedList
                  title="Top fabric types in this range"
                  rows={rangeAnalysis.topFabricTypes}
                  renderRow={([type, meters]) => (
                    <>
                      <span style={{ flex: 1 }}>{type}</span>
                      <span className="mono">{Math.round(meters)}m</span>
                    </>
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChartBlock({ title, series }) {
  const max = Math.max(1, ...series.map((s) => s.revenue));
  return (
    <div className="table-wrap" style={{ padding: 18, marginBottom: 22 }}>
      <h4 style={{ margin: "0 0 14px" }}>{title}</h4>
      <div className="mini-chart">
        {series.map((s, i) => (
          <div className="mini-chart-bar" key={i} title={`${s.label}: ${CURRENCY_SYMBOL}${Math.round(s.revenue).toLocaleString()}`}>
            <div className="mini-chart-fill" style={{ height: `${(s.revenue / max) * 100}%` }} />
            <span className="mini-chart-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedList({ title, rows, renderRow, empty = "No data yet." }) {
  return (
    <div className="table-wrap" style={{ padding: 18 }}>
      <h4 style={{ margin: "0 0 12px" }}>{title}</h4>
      {rows.length === 0 ? (
        <p className="dim" style={{ fontSize: "0.85rem" }}>{empty}</p>
      ) : (
        <ul className="ranked-list">
          {rows.map((r, i) => (
            <li key={i} className="ranked-list-row">{renderRow(r)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// CUSTOMER REQUEST FORM — logs a fabric a customer wanted but couldn't buy.
// Repeated requests for the same fabric_type + color_name combination
// increment a count on the backend instead of creating duplicates (see
// api.recordCustomerRequest / schema comment for the matching logic).
// ---------------------------------------------------------------------------
function CustomerRequestForm({ products, onRecorded }) {
  const [requestType, setRequestType] = useState("out_of_stock");
  const [fabricId, setFabricId] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [colorName, setColorName] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState(null);
  const fileInputRef = useRef(null);

  // When staff pick a known out-of-stock fabric, prefill type/color so the
  // dedup match on the backend actually lines up with that fabric's fields.
  function handleFabricPick(id) {
    setFabricId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setFabricType(product.fabricType);
      setColorName(product.colorName);
    }
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setFormError(null);
    if (!fabricType && !colorName && !photoFile) {
      setFormError("Add at least a fabric type/color, or a photo.");
      return;
    }
    setSaving(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const uploaded = await api.uploadRequestPhoto(photoFile);
        photoUrl = uploaded;
      }
      const { request, wasDuplicate } = await api.recordCustomerRequest({
        requestType,
        fabricId: fabricId || null,
        fabricType: fabricType || null,
        colorName: colorName || null,
        width: width ? Number(width) : null,
        quantityRequested: quantity ? Number(quantity) : null,
        photoUrl,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        warehouseId: "wh1",
        notes: notes || null,
      });
      setResult({ wasDuplicate, count: request.requestCount ?? request.request_count });
      setFabricId(""); setFabricType(""); setColorName(""); setWidth("");
      setQuantity(""); setCustomerName(""); setCustomerPhone(""); setNotes("");
      setPhotoFile(null); setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onRecorded?.();
    } catch (err) {
      setFormError("Could not save the request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin">
      <div className="admin-toolbar">
        <h3>Log Customer Request</h3>
      </div>

      {result && (
        <div className="sale-confirm">
          <Check size={15} />
          {result.wasDuplicate
            ? `Matched an existing request — now requested ${result.count} times.`
            : "New request logged."}
        </div>
      )}

      <div className="table-wrap" style={{ padding: 18 }}>
        <label>Request type
          <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
            <option value="out_of_stock">Out of Stock (we carry it, none left)</option>
            <option value="never_stocked">Never Stocked (we've never carried it)</option>
            <option value="special_order">Special Order</option>
          </select>
        </label>

        {requestType === "out_of_stock" && (
          <label>Which fabric (optional, but helps matching)
            <select value={fabricId} onChange={(e) => handleFabricPick(e.target.value)}>
              <option value="">Select fabric…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.colorName} — {p.fabricType} ({p.sku})</option>
              ))}
            </select>
          </label>
        )}

        <div className="form-row">
          <label>Fabric type
            <input value={fabricType} onChange={(e) => setFabricType(e.target.value)} placeholder="e.g. Cotton, Georgette" />
          </label>
          <label>Color
            <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Dust Rose" />
          </label>
        </div>

        <div className="form-row">
          <label>Width (optional)
            <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
          </label>
          <label>Quantity requested (meters)
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </div>

        <label>Swatch photo (optional)
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} />
        </label>
        {photoPreview && <img src={photoPreview} alt="Swatch preview" className="matcher-uploaded-img" />}

        <div className="form-row">
          <label>Customer name (optional)
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </label>
          <label>Customer phone (optional)
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </label>
        </div>

        <label>Notes (optional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? <Loader2 size={15} className="spin" /> : null} Log Request
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMAND INTELLIGENCE — reporting + resolution view for customer requests.
// "Estimated lost revenue" is an explainable, rule-based estimate (quantity
// requested × the fabric's retail price, or the catalog's average retail
// price when the fabric was never stocked) — not a guess dressed up as a
// precise figure. It's meant to size the opportunity, not be exact.
// ---------------------------------------------------------------------------
function DemandIntelligence({ products }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.fetchCustomerRequests().then(setRequests).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const avgRetailPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return products.reduce((s, p) => s + Number(p.retailPrice), 0) / products.length;
  }, [products]);

  const fabricById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  function estimatedValue(req) {
    const fabricId = req.fabricId || req.fabric_id;
    const qty = Number(req.quantityRequested ?? req.quantity_requested) || 1;
    const price = fabricById[fabricId]?.retailPrice ?? avgRetailPrice;
    const count = req.requestCount ?? req.request_count ?? 1;
    return qty * price * count;
  }

  async function handleStatus(id, status) {
    await api.setCustomerRequestStatus(id, status);
    load();
  }

  const openRequests = requests.filter((r) => r.status === "open");

  const mostRequested = [...openRequests]
    .sort((a, b) => (b.requestCount ?? b.request_count ?? 1) - (a.requestCount ?? a.request_count ?? 1))
    .slice(0, 8);

  const estimatedLostRevenue = openRequests.reduce((s, r) => s + estimatedValue(r), 0);

  const byType = { out_of_stock: 0, never_stocked: 0, special_order: 0 };
  for (const r of openRequests) {
    const type = r.requestType ?? r.request_type;
    if (type in byType) byType[type] += 1;
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading requests…</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin-stats">
        <div className="stat-card warn">
          <span className="stat-label">Open requests</span>
          <span className="stat-value">{openRequests.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Out of stock</span>
          <span className="stat-value">{byType.out_of_stock}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Never stocked</span>
          <span className="stat-value">{byType.never_stocked}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">Est. lost revenue</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(estimatedLostRevenue).toLocaleString()}</span>
        </div>
      </div>
      <p className="dim" style={{ fontSize: "0.78rem", marginTop: -10, marginBottom: 20 }}>
        Estimated lost revenue = quantity requested × retail price (or catalog average for
        never-stocked fabrics) × times requested. It's a sizing estimate, not an exact figure.
      </p>

      <RankedList
        title="Most requested unavailable fabrics"
        rows={mostRequested}
        empty="No open requests yet."
        renderRow={(r) => (
          <>
            <span>
              {(r.colorName ?? r.color_name) || "Unknown color"}
              <span className="dim"> — {(r.fabricType ?? r.fabric_type) || "Unknown type"}</span>
            </span>
            <span className="mono">×{r.requestCount ?? r.request_count ?? 1}</span>
          </>
        )}
      />

      <div className="table-wrap" style={{ padding: 18, marginTop: 16 }}>
        <h4 style={{ margin: "0 0 12px" }}>All open requests</h4>
        {openRequests.length === 0 ? (
          <p className="dim" style={{ fontSize: "0.85rem" }}>Nothing logged yet.</p>
        ) : (
          <div className="request-list">
            {openRequests.map((r) => (
              <div className="request-row" key={r.id}>
                <RequestPhotoThumb path={r.photoUrl ?? r.photo_url} />
                <div className="request-details">
                  <strong>{(r.colorName ?? r.color_name) || "Unknown color"} — {(r.fabricType ?? r.fabric_type) || "Unknown type"}</strong>
                  <span className="dim">
                    {(r.requestType ?? r.request_type)?.replace("_", " ")} · requested {r.requestCount ?? r.request_count ?? 1}× ·
                    last {new Date(r.lastRequestedAt ?? r.last_requested_at).toLocaleDateString()}
                  </span>
                  {(r.customerName ?? r.customer_name) && (
                    <span className="dim">{r.customerName ?? r.customer_name} {(r.customerPhone ?? r.customer_phone) ? `· ${r.customerPhone ?? r.customer_phone}` : ""}</span>
                  )}
                </div>
                <div className="request-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(r.id, "fulfilled")}>Fulfilled</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(r.id, "dismissed")}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestPhotoThumb({ path }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (path) {
      api.getRequestPhotoUrl(path).then((resolved) => {
        if (!cancelled) setUrl(resolved);
      });
    }
    return () => { cancelled = true; };
  }, [path]);

  if (!path) return <div className="request-thumb request-thumb-empty" />;
  if (!url) return <div className="request-thumb request-thumb-empty"><Loader2 size={14} className="spin" /></div>;
  return <img src={url} alt="Requested swatch" className="request-thumb" />;
}

// ---------------------------------------------------------------------------
// SUPPLIERS — simple CRUD over the suppliers table. No purchase-order
// workflow yet (that would need a schema addition); this is just contact
// info + notes, which is also what the Purchase List needs to point staff
// toward the right supplier for each fabric (see "supplier memory" below).
// ---------------------------------------------------------------------------
function SuppliersAdmin({ canManage }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", addressLine: "", notes: "", lat: null, lng: null });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    api.fetchSuppliers().then(setSuppliers).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditingId(null);
    setForm({ name: "", phone: "", addressLine: "", notes: "", lat: null, lng: null });
    setLocError(null);
    setShowForm(true);
  }

  function startEdit(s) {
    if (!canManage) return;
    setEditingId(s.id);
    setForm({
      name: s.name,
      phone: s.phone || "",
      addressLine: s.addressLine ?? s.address_line ?? "",
      notes: s.notes || "",
      lat: s.lat ?? null,
      lng: s.lng ?? null,
    });
    setLocError(null);
    setShowForm(true);
  }

  // Same pattern as the wholesale buyer signup form (WholesaleRequestForm)
  // — a one-tap GPS pin so staff visiting or calling a supplier can find
  // the exact location later, not just a general area from a text address.
  function captureLocation() {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Location isn't available on this device/browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocError("Couldn't get a location — check location permission and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSupplier(editingId, form);
      } else {
        await api.addSupplier(form);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  function requestRemove(supplier) {
    if (!canManage) return;
    setPendingDelete(supplier);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteSupplier(pendingDelete.id);
      setPendingDelete(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin">
      <div className="admin-toolbar">
        <h3>Suppliers</h3>
        <button className="btn btn-primary btn-sm" onClick={startAdd}><Plus size={14} /> Add Supplier</button>
      </div>

      {loading ? (
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading suppliers…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Location</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const lat = s.lat ?? null;
                const lng = s.lng ?? null;
                const mapUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="mono">{s.phone || "—"}</td>
                    <td>{s.addressLine ?? s.address_line ?? "—"}</td>
                    <td>
                      {mapUrl ? (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="map-link">
                          <MapPin size={12} /> Open in Maps
                        </a>
                      ) : (
                        <span className="dim" style={{ fontSize: "0.78rem" }}>No pin</span>
                      )}
                    </td>
                    <td className="dim">{s.notes || "—"}</td>
                    <td className="row-actions">
                      {canManage ? (
                        <>
                          <button onClick={() => startEdit(s)}><Pencil size={14} /></button>
                          <button onClick={() => requestRemove(s)}><Trash2 size={14} /></button>
                        </>
                      ) : (
                        <span className="dim" style={{ fontSize: "0.78rem" }}>Owner only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {suppliers.length === 0 && (
                <tr><td colSpan={6} className="dim" style={{ textAlign: "center", padding: 20 }}>No suppliers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="drawer-backdrop" onClick={() => setShowForm(false)}>
          <div className="drawer form-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h2>{editingId ? "Edit Supplier" : "Add Supplier"}</h2>

            <label>Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>Address
              <input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </label>
            <label>Notes
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Good bulk discounts, quality notes…" />
            </label>

            <label>GPS location <span className="optional">(optional, but makes them much easier to find later)</span>
              <div className="geo-capture">
                <button type="button" className="btn btn-ghost btn-sm" onClick={captureLocation} disabled={locating}>
                  <MapPin size={14} /> {locating ? "Locating…" : form.lat ? "Retake location" : "Capture current location"}
                </button>
                {form.lat != null && (
                  <span className="geo-confirmed"><Check size={13} /> {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
                )}
                {locError && <span className="geo-error">{locError}</span>}
              </div>
            </label>
            <p className="matcher-hint" style={{ marginTop: -4 }}>
              <Sparkles size={12} /> Stand at the supplier's shop/stall when you tap this — same as the GPS pin used for wholesale buyer addresses.
            </p>

            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? <Loader2 size={15} className="spin" /> : null} {editingId ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this supplier?"
          body={`"${pendingDelete.name}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PURCHASE LIST — Phase 3's Smart Purchase List + Purchase Priority Score.
//
// The priority score is a simple, explainable weighted formula — not a
// model. It only uses factors that are real and computable today:
//   - stock urgency       (out of stock scores higher than low stock)
//   - sales velocity      (meters sold recently, from Phase 1's logic)
//   - customer demand     (open requests for this fabric, from Phase 2)
//   - profit margin       (higher-margin items break ties upward)
//
// Lead time and seasonality are in the original spec but are deliberately
// NOT included yet: lead time would need real purchase-order history
// (there's no PO tracking yet, just batches after the fact), and
// seasonality needs a year+ of sales history this shop doesn't have yet.
// Adding fabricated inputs for either would make the score look more
// sophisticated than it actually is. Revisit once that data exists.
// ---------------------------------------------------------------------------
function PurchaseList({ products }) {
  const [dashData, setDashData] = useState(null);
  const [procurement, setProcurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualItems, setManualItems] = useState([]);
  const [manualFabricId, setManualFabricId] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    Promise.all([api.fetchDashboardMetrics(), api.fetchProcurementData()])
      .then(([dash, proc]) => { setDashData(dash); setProcurement(proc); })
      .finally(() => setLoading(false));
  }, []);

  const supplierById = useMemo(() => {
    if (!procurement) return {};
    return Object.fromEntries(procurement.suppliers.map((s) => [s.id, s]));
  }, [procurement]);

  // Most recent batch per fabric = "supplier memory": who we last bought
  // it from, at what price, and when.
  const lastBatchByFabric = useMemo(() => {
    if (!procurement) return {};
    const map = {};
    for (const b of procurement.batches) {
      const fid = b.fabricId ?? b.fabric_id;
      const existing = map[fid];
      const purchasedAt = b.purchasedAt ?? b.purchased_at;
      if (!existing || new Date(purchasedAt) > new Date(existing.purchasedAt ?? existing.purchased_at)) {
        map[fid] = b;
      }
    }
    return map;
  }, [procurement]);

  const purchaseList = useMemo(() => {
    if (!dashData) return [];
    const { sales, saleItems, openRequests = [] } = dashData;
    const saleById = Object.fromEntries(sales.map((s) => [s.id, s]));

    // Meters sold in the last 30 days, per fabric — recent velocity matters
    // more for reorder urgency than all-time totals.
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMetersByFabric = {};
    for (const item of saleItems) {
      const sale = saleById[item.saleId ?? item.sale_id];
      if (!sale) continue;
      const soldAt = new Date(sale.soldAt ?? sale.sold_at);
      if (soldAt < thirtyDaysAgo) continue;
      const fid = item.fabricId ?? item.fabric_id;
      recentMetersByFabric[fid] = (recentMetersByFabric[fid] || 0) + Number(item.meters);
    }

    const norm = (s) => (s || "").trim().toLowerCase();
    function requestCountFor(product) {
      return openRequests
        .filter((r) => {
          const rFabricId = r.fabricId ?? r.fabric_id;
          if (rFabricId) return rFabricId === product.id;
          return norm(r.fabricType ?? r.fabric_type) === norm(product.fabricType) && norm(r.colorName ?? r.color_name) === norm(product.colorName);
        })
        .reduce((s, r) => s + (r.requestCount ?? r.request_count ?? 1), 0);
    }

    const candidates = products.filter((p) => Number(p.stockMeters) < 20); // low stock or out of stock

    return candidates.map((p) => {
      const stockMeters = Number(p.stockMeters);
      const recentMeters = recentMetersByFabric[p.id] || 0;
      const requestCount = requestCountFor(p);
      const lastBatch = lastBatchByFabric[p.id];
      const margin = p.retailPrice > 0 ? ((p.retailPrice - (lastBatch?.costPerMeter ?? lastBatch?.cost_per_meter ?? p.wholesalePrice * 0.8)) / p.retailPrice) : 0;

      // Score components, each roughly 0-10 before weighting, so no single
      // factor can silently dominate:
      const stockUrgency = stockMeters === 0 ? 10 : Math.max(0, 10 - stockMeters / 2); // 0m -> 10, 20m -> 0
      const velocityScore = Math.min(10, recentMeters / 5); // 50m/mo -> capped at 10
      const demandScore = Math.min(10, requestCount * 3); // each open request is a strong signal
      const marginScore = Math.max(0, Math.min(10, margin * 20)); // 50% margin -> 10

      const priorityScore = stockUrgency * 3 + velocityScore * 2.5 + demandScore * 3 + marginScore * 1.5;

      const reasons = [];
      if (stockMeters === 0) reasons.push("out of stock");
      else if (stockMeters < 10) reasons.push(`only ${stockMeters}m left`);
      if (recentMeters > 0) reasons.push(`${recentMeters}m sold in last 30 days`);
      if (requestCount > 0) reasons.push(`${requestCount} customer request${requestCount > 1 ? "s" : ""}`);
      if (margin > 0.3) reasons.push(`${Math.round(margin * 100)}% margin`);
      if (reasons.length === 0) reasons.push("low stock");

      // Suggested quantity: cover ~60 days of recent velocity, or a small
      // standard restock if there's no sales history to go on yet.
      const suggestedQuantity = recentMeters > 0 ? Math.ceil(recentMeters * 2) : 30;
      const estimatedCost = lastBatch?.costPerMeter ?? lastBatch?.cost_per_meter ?? p.wholesalePrice * 0.8;
      const estimatedBudget = suggestedQuantity * estimatedCost;

      const supplierId = lastBatch?.supplierId ?? lastBatch?.supplier_id;
      const supplier = supplierId ? supplierById[supplierId] : null;

      return {
        product: p,
        priorityScore,
        reasons,
        suggestedQuantity,
        estimatedBudget,
        supplier,
        lastPrice: lastBatch?.costPerMeter ?? lastBatch?.cost_per_meter,
        lastPurchaseDate: lastBatch?.purchasedAt ?? lastBatch?.purchased_at,
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [dashData, products, lastBatchByFabric, supplierById]);

  const totalBudget = [...purchaseList, ...manualItems].reduce((s, item) => s + (item.estimatedBudget || 0), 0);

  function addManualItem(fabricId) {
    const product = products.find((p) => p.id === fabricId);
    if (!product || manualItems.some((m) => m.product.id === fabricId) || purchaseList.some((m) => m.product.id === fabricId)) return;
    const lastBatch = lastBatchByFabric[fabricId];
    const estimatedCost = lastBatch?.costPerMeter ?? lastBatch?.cost_per_meter ?? product.wholesalePrice * 0.8;
    setManualItems((prev) => [...prev, {
      product,
      priorityScore: null,
      reasons: ["manually added"],
      suggestedQuantity: 30,
      estimatedBudget: 30 * estimatedCost,
      supplier: lastBatch ? supplierById[lastBatch.supplierId ?? lastBatch.supplier_id] : null,
      lastPrice: lastBatch?.costPerMeter ?? lastBatch?.cost_per_meter,
      lastPurchaseDate: lastBatch?.purchasedAt ?? lastBatch?.purchased_at,
      manual: true,
    }]);
    setManualFabricId("");
    setManualQuery("");
  }

  function selectManualFabric(product) {
    setManualFabricId(product.id);
    setManualQuery(`${product.colorName} — ${product.fabricType} (${product.sku})`);
    setShowSuggestions(false);
  }

  // Typeahead over SKU / color / fabric type — plain fabrics.map() is fine
  // at this catalog size (thousands of rows, not millions; see README's
  // scale note), so no need for a search index here.
  const manualSuggestions = useMemo(() => {
    const q = manualQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.sku?.toLowerCase().includes(q) || p.colorName?.toLowerCase().includes(q) || p.fabricType?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [manualQuery, products]);

  function removeManualItem(fabricId) {
    setManualItems((prev) => prev.filter((m) => m.product.id !== fabricId));
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> Building purchase list…</p>
      </div>
    );
  }

  const allItems = [...purchaseList, ...manualItems];

  return (
    <div className="admin">
      <div className="admin-stats">
        <div className="stat-card warn">
          <span className="stat-label">Items to purchase</span>
          <span className="stat-value">{allItems.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estimated budget</span>
          <span className="stat-value">{CURRENCY_SYMBOL}{Math.round(totalBudget).toLocaleString()}</span>
        </div>
      </div>

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <label>Add a fabric manually
          <div style={{ display: "flex", gap: 8, position: "relative" }}>
            <div className="manual-search-wrap" style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                value={manualQuery}
                placeholder="Type a SKU, color, or fabric type to search…"
                onChange={(e) => {
                  setManualQuery(e.target.value);
                  setManualFabricId("");
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && manualQuery.trim() && (
                <div className="manual-suggestions">
                  {manualSuggestions.length === 0 ? (
                    <div className="manual-suggestion-empty">No fabrics match "{manualQuery}"</div>
                  ) : (
                    manualSuggestions.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className="manual-suggestion-item"
                        onMouseDown={() => selectManualFabric(p)}
                      >
                        <span className="table-swatch" style={{ background: p.hex }} />
                        <span>{p.colorName} — {p.fabricType}</span>
                        <span className="mono dim">{p.sku}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => addManualItem(manualFabricId)} disabled={!manualFabricId}>
              <Plus size={14} /> Add
            </button>
          </div>
        </label>
      </div>

      {allItems.length === 0 ? (
        <p className="dim">Nothing needs purchasing right now — no low-stock items and no open customer requests.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fabric</th>
                <th>Priority</th>
                <th>Reason</th>
                <th>Suggested qty</th>
                <th>Est. budget</th>
                <th>Preferred supplier</th>
                <th>Last price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item) => (
                <tr key={item.product.id}>
                  <td>{item.product.colorName} <span className="dim">— {item.product.fabricType}</span></td>
                  <td>{item.priorityScore !== null ? Math.round(item.priorityScore) : <span className="dim">manual</span>}</td>
                  <td className="dim" style={{ fontSize: "0.78rem" }}>{item.reasons.join(" · ")}</td>
                  <td className="mono">{item.suggestedQuantity}m</td>
                  <td className="mono">{CURRENCY_SYMBOL}{Math.round(item.estimatedBudget).toLocaleString()}</td>
                  <td>{item.supplier?.name || <span className="dim">no history</span>}</td>
                  <td className="mono">
                    {item.lastPrice ? `${CURRENCY_SYMBOL}${item.lastPrice}` : "—"}
                    {item.lastPurchaseDate && <span className="dim"> · {new Date(item.lastPurchaseDate).toLocaleDateString()}</span>}
                  </td>
                  <td>
                    {item.manual && (
                      <button className="icon-btn" onClick={() => removeManualItem(item.product.id)}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MARKET MODE (Phase 4) — an offline-tolerant shopping assistant for
// visiting wholesalers. Two views: a list of trips (sessions), and an
// active trip's shopping list.
//
// Offline handling: writes made while offline go through marketOutbox.js
// (queued in localStorage, replayed in order once back online). This is a
// simple outbox, not a full sync engine — reasonable for one shop's staff
// on one device at a time; see README for why a heavier sync library
// wasn't used. Reads still require a connection when in Supabase mode —
// only the mutations that would otherwise be lost mid-trip are queued.
// ---------------------------------------------------------------------------
function MarketMode({ products, currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [online, setOnline] = useState(marketOutbox.isOnline());
  const [queuedCount, setQueuedCount] = useState(marketOutbox.getQueuedCount());

  function load() {
    setLoading(true);
    api.fetchShoppingSessions().then(setSessions).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      if (api.isBackendLive) {
        marketOutbox.flushOutbox(api.rawBackend).then((result) => {
          setQueuedCount(result.remaining);
          if (result.flushed > 0) load();
        });
      }
    }
    function handleOffline() { setOnline(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function handleCreateTrip({ title, seedFromPurchaseList }) {
    let seedItems = [];
    if (seedFromPurchaseList) {
      // Re-derive the current Purchase List so the trip starts pre-loaded
      // with what actually needs buying, instead of staff retyping it.
      const [dash, procurement] = await Promise.all([api.fetchDashboardMetrics(), api.fetchProcurementData()]);
      seedItems = buildPurchaseListSeed(products, dash, procurement);
    }
    const session = await api.createShoppingSession({
      title,
      createdBy: currentUser?.id,
      seedItems,
    });
    load();
    setShowNewTrip(false);
    setActiveSessionId(session.id);
  }

  if (activeSessionId) {
    return (
      <ShoppingTrip
        sessionId={activeSessionId}
        products={products}
        online={online}
        onBack={() => { setActiveSessionId(null); load(); }}
        onQueuedCountChange={setQueuedCount}
      />
    );
  }

  return (
    <div className="admin">
      <div className="admin-toolbar">
        <h3>Market Mode</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ConnectionBadge online={online} queuedCount={queuedCount} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewTrip(true)}>
            <Plus size={14} /> Start Trip
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading trips…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Trip</th><th>Status</th><th>Started</th><th></th></tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="clickable-row" onClick={() => setActiveSessionId(s.id)}>
                  <td>{s.title}</td>
                  <td><span className={`status-pill ${s.status}`}>{s.status}</span></td>
                  <td className="dim">{new Date(s.startedAt ?? s.started_at).toLocaleDateString()}</td>
                  <td><ChevronRight size={16} /></td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={4} className="dim" style={{ textAlign: "center", padding: 20 }}>No trips yet — start one before heading to the market.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showNewTrip && (
        <NewTripForm onCancel={() => setShowNewTrip(false)} onCreate={handleCreateTrip} />
      )}
    </div>
  );
}

function ConnectionBadge({ online, queuedCount }) {
  if (online && queuedCount === 0) return null; // don't clutter the UI when everything's normal
  return (
    <span className={`connection-badge ${online ? "syncing" : "offline"}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {online ? `Syncing ${queuedCount} change${queuedCount === 1 ? "" : "s"}…` : `Offline${queuedCount > 0 ? ` · ${queuedCount} queued` : ""}`}
    </span>
  );
}

function NewTripForm({ onCancel, onCreate }) {
  const [title, setTitle] = useState(`Market trip — ${new Date().toLocaleDateString()}`);
  const [seedFromPurchaseList, setSeedFromPurchaseList] = useState(true);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreate({ title, seedFromPurchaseList });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onCancel}>
      <div className="drawer form-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onCancel}><X size={18} /></button>
        <h2>Start a Market Trip</h2>
        <label>Trip name
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={seedFromPurchaseList} onChange={(e) => setSeedFromPurchaseList(e.target.checked)} style={{ width: "auto" }} />
          Pre-load with current Purchase List suggestions
        </label>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating} style={{ marginTop: 8 }}>
          {creating ? <Loader2 size={15} className="spin" /> : null} Start Trip
        </button>
      </div>
    </div>
  );
}

// Reuses the same priority-scoring logic as PurchaseList so a trip seeded
// "from the Purchase List" actually matches what that screen shows,
// instead of drifting into a second, slightly different formula.
function buildPurchaseListSeed(products, dashData, procurement) {
  const { sales, saleItems, openRequests = [] } = dashData;
  const saleById = Object.fromEntries(sales.map((s) => [s.id, s]));
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentMetersByFabric = {};
  for (const item of saleItems) {
    const sale = saleById[item.saleId ?? item.sale_id];
    if (!sale) continue;
    if (new Date(sale.soldAt ?? sale.sold_at) < thirtyDaysAgo) continue;
    const fid = item.fabricId ?? item.fabric_id;
    recentMetersByFabric[fid] = (recentMetersByFabric[fid] || 0) + Number(item.meters);
  }
  const norm = (s) => (s || "").trim().toLowerCase();
  function requestCountFor(product) {
    return openRequests.filter((r) => {
      const rFabricId = r.fabricId ?? r.fabric_id;
      if (rFabricId) return rFabricId === product.id;
      return norm(r.fabricType ?? r.fabric_type) === norm(product.fabricType) && norm(r.colorName ?? r.color_name) === norm(product.colorName);
    }).reduce((s, r) => s + (r.requestCount ?? r.request_count ?? 1), 0);
  }
  const lastBatchByFabric = {};
  for (const b of procurement.batches) {
    const fid = b.fabricId ?? b.fabric_id;
    const existing = lastBatchByFabric[fid];
    const purchasedAt = b.purchasedAt ?? b.purchased_at;
    if (!existing || new Date(purchasedAt) > new Date(existing.purchasedAt ?? existing.purchased_at)) lastBatchByFabric[fid] = b;
  }

  return products
    .filter((p) => Number(p.stockMeters) < 20)
    .map((p) => {
      const stockMeters = Number(p.stockMeters);
      const recentMeters = recentMetersByFabric[p.id] || 0;
      const requestCount = requestCountFor(p);
      const stockUrgency = stockMeters === 0 ? 10 : Math.max(0, 10 - stockMeters / 2);
      const velocityScore = Math.min(10, recentMeters / 5);
      const demandScore = Math.min(10, requestCount * 3);
      const priorityScore = stockUrgency * 3 + velocityScore * 2.5 + demandScore * 3;
      const reasons = [];
      if (stockMeters === 0) reasons.push("out of stock");
      else if (stockMeters < 10) reasons.push(`only ${stockMeters}m left`);
      if (recentMeters > 0) reasons.push(`${recentMeters}m sold recently`);
      if (requestCount > 0) reasons.push(`${requestCount} requested`);
      const lastBatch = lastBatchByFabric[p.id];
      return {
        fabricId: p.id,
        fabricType: p.fabricType,
        colorName: p.colorName,
        plannedQuantity: recentMeters > 0 ? Math.ceil(recentMeters * 2) : 30,
        supplierId: lastBatch?.supplierId ?? lastBatch?.supplier_id ?? null,
        reason: reasons.join(" · "),
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

const SHOPPING_STATUSES = ["planned", "purchased", "partial", "unavailable", "skipped"];

// ---------------------------------------------------------------------------
// SHOPPING TRIP — the actual in-market screen: live list, status buttons
// per item, progress summary, collection completion, trip notes, and
// closing the trip out (which turns purchased/partial items into real
// stock — see api.closeShoppingSession).
// ---------------------------------------------------------------------------
function ShoppingTrip({ sessionId, products, online, onBack, onQueuedCountChange }) {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [closing, setClosing] = useState(false);
  const [collectionType, setCollectionType] = useState("");

  function load() {
    setLoading(true);
    if (online) {
      Promise.all([api.fetchShoppingSessions(), api.fetchShoppingItems(sessionId)])
        .then(([sessions, fetchedItems]) => {
          const s = sessions.find((x) => x.id === sessionId);
          setSession(s);
          setNotes(s?.notes || "");
          setItems(fetchedItems);
          marketOutbox.primeCache(sessions, fetchedItems);
        })
        .finally(() => setLoading(false));
    } else {
      // Offline: fall back to whatever was last cached before connectivity
      // dropped, plus anything queued locally since.
      const cache = marketOutbox.getCache();
      const s = cache.sessions.find((x) => x.id === sessionId);
      setSession(s);
      setNotes(s?.notes || "");
      setItems(cache.items.filter((i) => i.sessionId === sessionId));
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [sessionId, online]);

  async function updateItemStatus(item, status, extra = {}) {
    const updates = { status, ...extra };
    if (online) {
      await api.updateShoppingItem(item.id, updates);
      load();
    } else {
      marketOutbox.queueUpdateItem(item.id, updates);
      onQueuedCountChange(marketOutbox.getQueuedCount());
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...updates, _pending: true } : i)));
    }
  }

  async function saveNotes() {
    if (online) {
      await api.updateShoppingSessionNotes(sessionId, notes);
    } else {
      marketOutbox.queueUpdateSessionNotes(sessionId, notes);
      onQueuedCountChange(marketOutbox.getQueuedCount());
    }
  }

  async function addDiscoveredItem({ fabricType, colorName, plannedQuantity }) {
    const payload = { fabricType, colorName, plannedQuantity: plannedQuantity || null, isDiscovered: true };
    if (online) {
      await api.addShoppingItem(sessionId, payload);
      load();
    } else {
      marketOutbox.queueAddItem(sessionId, payload);
      onQueuedCountChange(marketOutbox.getQueuedCount());
      setItems((prev) => [...prev, { id: "pending_" + Date.now(), sessionId, status: "planned", ...payload, _pending: true }]);
    }
    setShowAddItem(false);
  }

  async function handleCloseTrip() {
    setClosing(true);
    try {
      const result = await api.closeShoppingSession(sessionId, { warehouseId: "wh1" });
      alert(`Trip closed. ${result.batchesCreated} item(s) added to inventory.`);
      onBack();
    } catch (err) {
      alert("Could not close the trip — check your connection and try again.");
    } finally {
      setClosing(false);
    }
  }

  const progress = useMemo(() => {
    const counts = { planned: 0, purchased: 0, partial: 0, unavailable: 0, skipped: 0 };
    for (const i of items) counts[i.status] = (counts[i.status] || 0) + 1;
    const remaining = counts.planned;
    return { ...counts, total: items.length, remaining };
  }, [items]);

  // Collection completion: for a chosen fabric type, which colors exist in
  // the catalog vs. this trip's shopping list. This uses the catalog's own
  // existing colors as the "expected" set — there's no separate canonical
  // collection definition, so this shows "colors we've carried before but
  // aren't currently stocking/buying," not "colors that officially belong
  // to this line." Worth a real collections concept later if that
  // distinction matters.
  const collectionTypes = useMemo(() => [...new Set(products.map((p) => p.fabricType))].sort(), [products]);
  const collectionStatus = useMemo(() => {
    if (!collectionType) return null;
    const knownColors = [...new Set(products.filter((p) => p.fabricType === collectionType).map((p) => p.colorName))];
    const inStockColors = new Set(products.filter((p) => p.fabricType === collectionType && Number(p.stockMeters) > 0).map((p) => p.colorName));
    const onThisTripColors = new Set(
      items.filter((i) => (i.fabricType ?? i.fabric_type) === collectionType && i.status !== "skipped").map((i) => i.colorName ?? i.color_name)
    );
    return knownColors.map((color) => ({
      color,
      covered: inStockColors.has(color) || onThisTripColors.has(color),
    }));
  }, [collectionType, products, items]);

  if (loading || !session) {
    return (
      <div className="admin">
        <p className="loading-state"><Loader2 size={16} className="spin" /> Loading trip…</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <div className="admin-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14} /> All trips</button>
        <ConnectionBadge online={online} queuedCount={marketOutbox.getQueuedCount()} />
      </div>

      <h3 style={{ marginTop: 4 }}>{session.title}</h3>

      <div className="progress-summary">
        <span><strong>{progress.total}</strong> planned</span>
        <span className="ok"><strong>{progress.purchased}</strong> purchased</span>
        <span className="warn"><strong>{progress.partial}</strong> partial</span>
        <span className="danger"><strong>{progress.unavailable}</strong> unavailable</span>
        <span className="dim"><strong>{progress.skipped}</strong> skipped</span>
        <span><strong>{progress.remaining}</strong> remaining</span>
      </div>

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <div className="admin-toolbar" style={{ marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>Shopping list</h4>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAddItem(true)}><Plus size={14} /> Add discovered item</button>
        </div>
        {items.length === 0 ? (
          <p className="dim" style={{ fontSize: "0.85rem" }}>No items yet.</p>
        ) : (
          <div className="request-list">
            {items.map((item) => (
              <ShoppingListRow key={item.id} item={item} onSetStatus={updateItemStatus} />
            ))}
          </div>
        )}
      </div>

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 12px" }}>Collection completion</h4>
        <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)} style={{ marginBottom: 12 }}>
          <option value="">Check a fabric type…</option>
          {collectionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {collectionStatus && (
          <div className="collection-grid">
            {collectionStatus.map(({ color, covered }) => (
              <span key={color} className={`collection-chip ${covered ? "covered" : "missing"}`}>
                {covered ? <Check size={12} /> : <X size={12} />} {color}
              </span>
            ))}
          </div>
        )}
        <p className="dim" style={{ fontSize: "0.75rem", marginTop: 10 }}>
          Based on colors already in the catalog for this fabric type — not a
          fixed "official" collection list.
        </p>
      </div>

      <div className="table-wrap" style={{ padding: 18, marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 12px" }}>Trip notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="e.g. Supplier A has better quality. Supplier B gives discounts after 20 rolls."
          className="trip-notes-textarea"
        />
      </div>

      {session.status === "open" && (
        <button className="btn btn-primary" onClick={handleCloseTrip} disabled={closing || !online}>
          {closing ? <Loader2 size={15} className="spin" /> : null} Close Trip & Add to Inventory
        </button>
      )}
      {session.status === "open" && !online && (
        <p className="dim" style={{ fontSize: "0.78rem", marginTop: 6 }}>Closing a trip needs a connection — reconnect first.</p>
      )}
      {session.status === "closed" && (
        <p className="dim">This trip is closed. Purchased items were added to inventory.</p>
      )}

      {showAddItem && (
        <AddDiscoveredItemForm onCancel={() => setShowAddItem(false)} onAdd={addDiscoveredItem} />
      )}
    </div>
  );
}

function ShoppingListRow({ item, onSetStatus }) {
  const [showDetails, setShowDetails] = useState(false);
  const [actualQuantity, setActualQuantity] = useState(item.actualQuantity ?? item.actual_quantity ?? "");
  const [actualPrice, setActualPrice] = useState(item.actualPricePerMeter ?? item.actual_price_per_meter ?? "");

  const status = item.status;
  const fabricType = item.fabricType ?? item.fabric_type;
  const colorName = item.colorName ?? item.color_name;
  const plannedQuantity = item.plannedQuantity ?? item.planned_quantity;
  const reason = item.reason;

  function confirmPurchase(targetStatus) {
    onSetStatus(item, targetStatus, {
      actualQuantity: actualQuantity ? Number(actualQuantity) : null,
      actualPricePerMeter: actualPrice ? Number(actualPrice) : null,
    });
    setShowDetails(false);
  }

  return (
    <div className="request-row shopping-row">
      <div className="request-details">
        <strong>{colorName || "Unknown color"} <span className="dim">— {fabricType || "Unknown type"}</span></strong>
        {plannedQuantity && <span className="dim">{plannedQuantity}m planned</span>}
        {reason && <span className="dim">{reason}</span>}
        {item._pending && <span className="dim pending-tag">not yet synced</span>}
      </div>
      <div className="request-actions">
        {status === "planned" && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDetails(!showDetails)}>Purchased</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(item, "unavailable")}>Unavailable</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(item, "skipped")}>Skip</button>
          </>
        )}
        {status !== "planned" && <span className={`status-pill ${status}`}>{status}</span>}
      </div>
      {showDetails && (
        <div className="purchase-detail-form">
          <input type="number" placeholder="Meters bought" value={actualQuantity} onChange={(e) => setActualQuantity(e.target.value)} />
          <input type="number" placeholder="Price/m" value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => confirmPurchase(Number(actualQuantity) < Number(plannedQuantity) ? "partial" : "purchased")}>
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

function AddDiscoveredItemForm({ onCancel, onAdd }) {
  const [fabricType, setFabricType] = useState("");
  const [colorName, setColorName] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");

  return (
    <div className="drawer-backdrop" onClick={onCancel}>
      <div className="drawer form-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onCancel}><X size={18} /></button>
        <h2>Add Discovered Product</h2>
        <label>Fabric type
          <input value={fabricType} onChange={(e) => setFabricType(e.target.value)} placeholder="e.g. Georgette" />
        </label>
        <label>Color
          <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Dust Rose" />
        </label>
        <label>Quantity of interest (meters, optional)
          <input type="number" value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} />
        </label>
        <button
          className="btn btn-primary"
          onClick={() => onAdd({ fabricType, colorName, plannedQuantity: plannedQuantity ? Number(plannedQuantity) : null })}
          disabled={!fabricType && !colorName}
          style={{ marginTop: 8 }}
        >
          Add to List
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CART PANEL — multi-item order review. Since a wa.me link can only carry
// one pre-filled message, this screen is where multiple selections get
// consolidated into a single order before handing off to WhatsApp.
// ---------------------------------------------------------------------------

function CartLineItem({ item, mode, onUpdateQty, onRemove }) {
  const { t } = useLang();
  const presets = QTY_PRESETS[mode];
  const minQty = mode === "wholesale" ? WHOLESALE_MIN_METERS : 1;
  const belowMin = mode === "wholesale" && item.qty < WHOLESALE_MIN_METERS;
  const price = mode === "wholesale" ? item.product.wholesalePrice : item.product.retailPrice;

  return (
    <div className="cart-line">
      <span className="cart-line-swatch" style={{ background: item.product.hex }} />
      <div className="cart-line-info">
        <span className="cart-line-name">{item.product.colorName}</span>
        <span className="cart-line-sub">{item.product.fabricType} · {item.product.width}" · {CURRENCY_SYMBOL}{price}/m</span>
        {belowMin && <span className="cart-line-warn">{t("belowMinimum", { min: minQty })}</span>}
      </div>
      <div className="cart-line-qty">
        <span className="mini-label">{t("cartQuantity")}</span>
        <div className="qty-presets">
          {presets.map((p) => (
            <button
              key={p}
              className={item.qty === p ? "active" : ""}
              onClick={() => onUpdateQty(item.product.id, p)}
            >
              {p}
            </button>
          ))}
          <input
            type="number"
            min={1}
            className="qty-custom"
            value={item.qty}
            onChange={(e) => onUpdateQty(item.product.id, Math.max(1, Number(e.target.value) || 1))}
            title={t("cartCustomQty")}
          />
        </div>
      </div>
      <button className="cart-line-remove" onClick={() => onRemove(item.product.id)}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function CartPanel({ cart, mode, onUpdateQty, onRemove, onClear, onClose, buyerLabel }) {
  const { t } = useLang();
  const totalMeters = cart.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const minQty = mode === "wholesale" ? WHOLESALE_MIN_METERS : 1;

  function handleSend() {
    const url = buildWhatsAppOrderUrl(cart, mode, buyerLabel);
    window.open(url, "_blank");
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer cart-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        <div className="drawer-body">
          <h2>{t("cartTitle")}</h2>

          {cart.length === 0 ? (
            <p className="empty-state">{t("cartEmpty")}</p>
          ) : (
            <>
              {mode === "wholesale" && (
                <p className="cart-min-notice">{t("cartMinNotice", { min: minQty })}</p>
              )}
              <div className="cart-lines">
                {cart.map((item) => (
                  <CartLineItem key={item.product.id} item={item} mode={mode} onUpdateQty={onUpdateQty} onRemove={onRemove} />
                ))}
              </div>

              <div className="cart-total-row">
                <span>{t("cartTotal")}</span>
                <span className="cart-total-value">{totalMeters} {t("cartTotalMeters")}</span>
              </div>

              <div className="drawer-actions">
                <button className="btn btn-primary" onClick={handleSend}>
                  {t("sendViaWhatsapp")}
                </button>
                <button className="btn btn-ghost" onClick={onClear}>
                  {t("cartClear")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTH — staff/admin login and wholesale buyer login. This is a front-end
// demo of the intended flow: credentials are checked against in-memory seed
// data, which is fine for prototyping but is NOT real security — anyone
// could read the "passwords" from browser dev tools. A real deployment
// needs this logic to live in a backend (e.g. Supabase Auth) so credentials
// and role checks are enforced server-side, not just hidden in the UI.
// ---------------------------------------------------------------------------

function StaffLogin({ onLogin, onCancel }) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const user = await api.staffSignIn(username, password);
      onLogin(user);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="matcher">
      <div className="auth-card">
        <img src="/logo-full.png" alt="Raihan Fabrics" className="auth-logo" />
        <h2>{t("staffLoginTitle")}</h2>
        <p className="hero-sub">{t("staffLoginSub")}</p>
        <form onSubmit={submit} className="auth-form">
          <label>{t("usernameLabel")}
            <input value={username} onChange={(e) => { setUsername(e.target.value); setError(false); }} autoComplete="username" />
          </label>
          <label>{t("passwordLabel")}
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} autoComplete="current-password" />
          </label>
          {error && <p className="auth-error">{t("loginError")}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? <Loader2 size={15} className="spin" /> : null} {t("signIn")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{t("continueBrowsing")}</button>
        </form>
      </div>
    </div>
  );
}

function WholesaleLogin({ onLogin, onGoToRequest, onCancel }) {
  const { t } = useLang();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const account = await api.wholesaleSignIn(phone, password);
      onLogin(account);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="matcher">
      <div className="auth-card">
        <img src="/logo-full.png" alt="Raihan Fabrics" className="auth-logo" />
        <h2>{t("wholesaleLoginTitle")}</h2>
        <p className="hero-sub">
          {t("wholesaleLoginSub")}{" "}
          <button type="button" className="auth-link" onClick={onGoToRequest}>{t("requestAccessLink")}</button>
        </p>
        <form onSubmit={submit} className="auth-form">
          <label>{t("phoneNumberLabel")}
            <input value={phone} onChange={(e) => { setPhone(e.target.value); setError(false); }} placeholder="+93 …" autoComplete="tel" />
          </label>
          <label>{t("passwordLabel")}
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} autoComplete="current-password" />
          </label>
          {error && <p className="auth-error">{t("wholesaleLoginError")}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? <Loader2 size={15} className="spin" /> : null} {t("signIn")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{t("continueBrowsing")}</button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONTACT — business address (placeholder text + coordinates) and direct
// WhatsApp/phone contact, separate from the wholesale order flow.
// ---------------------------------------------------------------------------

function ContactSection() {
  const { t } = useLang();
  const mapUrl = `https://www.google.com/maps?q=${SHOP_INFO.lat},${SHOP_INFO.lng}`;
  const whatsappUrl = `https://wa.me/${SHOP_WHATSAPP_NUMBER}`;
  const telUrl = `tel:${SHOP_INFO.phoneDisplay.replace(/\s/g, "")}`;

  return (
    <div className="matcher">
      <div className="matcher-intro">
        <p className="eyebrow">{t("navContact")}</p>
        <h1>{t("contactTitle")}</h1>
        <p className="hero-sub">{t("contactSub")}</p>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <MapPin size={20} className="contact-icon" />
          <h4>{t("ourAddress")}</h4>
          <p>{SHOP_INFO.addressLine}</p>
          <p className="contact-sub">{SHOP_INFO.addressArea}</p>
          <p className="contact-coords mono">{SHOP_INFO.lat.toFixed(4)}, {SHOP_INFO.lng.toFixed(4)}</p>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
            <MapPin size={13} /> {t("openInMapsBtn")}
          </a>
        </div>

        <div className="contact-card">
          <MessageCircle size={20} className="contact-icon" />
          <h4>{t("chatOnWhatsapp")}</h4>
          <p className="contact-sub">{SHOP_INFO.whatsappDisplay}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            <MessageCircle size={13} /> {t("chatOnWhatsapp")}
          </a>
        </div>

        <div className="contact-card">
          <Phone size={20} className="contact-icon" />
          <h4>{t("callUs")}</h4>
          <p className="contact-sub">{SHOP_INFO.phoneDisplay}</p>
          <a href={telUrl} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
            <Phone size={13} /> {t("callUs")}
          </a>
        </div>
      </div>

      <p className="contact-placeholder-note">{t("addressPlaceholderNote")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP SHELL
// ---------------------------------------------------------------------------

// Fallback shown if a staff (non-owner) session somehow ends up on an
// owner-only tab (Dashboard, Trends) — the tab buttons themselves are
// already hidden for staff, so in practice this is just a safety net,
// not something staff will normally see.
function OwnerOnlyNotice() {
  return (
    <div className="admin">
      <div className="empty-state" style={{ padding: 40, textAlign: "center" }}>
        <ShieldCheck size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
        <p>This section is only available to the owner.</p>
      </div>
    </div>
  );
}

// Top-level pages the URL hash can point to. Kept in one place so the
// initial-load reader and the hash-writer below can't drift apart.
const VALID_VIEWS = ["storefront", "matcher", "wholesale-signup", "wholesale-login", "staff-login", "contact", "admin"];

// On first load, read the page (and, for admin, the tab) straight out of
// the URL hash — e.g. "#/admin/inventory" — instead of always starting at
// "storefront". This is what makes a refresh land back where you were
// instead of bouncing to the home page.
function readViewFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [top] = raw.split("/");
  return VALID_VIEWS.includes(top) ? top : "storefront";
}
function readAdminTabFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [, tab] = raw.split("/");
  return tab || "dashboard";
}

export default function TextileApp() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [wholesaleAccounts, setWholesaleAccounts] = useState([]);
  const [wholesaleLoading, setWholesaleLoading] = useState(true);
  const [view, setView] = useState(readViewFromHash);
  const [adminTab, setAdminTab] = useState(readAdminTabFromHash);
  const [mode, setMode] = useState("retail");
  const [matcherOpenProduct, setMatcherOpenProduct] = useState(null);
  const [lang, setLang] = useState("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [wholesaleUser, setWholesaleUser] = useState(null);

  const dir = LANGUAGES[lang].dir;
  const t = useTranslation(lang);

  // Wholesale pricing is reachable only if staff is signed in (to help a
  // walk-in customer) or an approved wholesale buyer is signed into their
  // own account. Everyone else is locked to retail.
  const canToggleWholesale = !!adminUser || (wholesaleUser && wholesaleUser.status === "approved");
  // General owner-only gate, reused for wholesale account management,
  // supplier edit/delete, and the Dashboard/Trends tabs — staff (non-owner)
  // logins can't reach any of those, per the shop's access rules.
  const isOwner = adminUser?.role === "owner";
  const canManageWholesaleAccounts = isOwner;
  const effectiveMode = canToggleWholesale ? mode : "retail";

  // ---- initial data load: restore session, fetch products + accounts ----
  useEffect(() => {
    api.fetchProducts().then(setProducts).finally(() => setProductsLoading(false));

    api.getSession().then((session) => {
      if (session?.type === "staff") setAdminUser(session.user);
      if (session?.type === "wholesale") setWholesaleUser(session.user);
    });
  }, []);

  // ---- keep the URL hash in sync with where you are, so a refresh (or a
  // shared/bookmarked link) lands back on the same page instead of always
  // resetting to the storefront. replaceState (not pushState) so navigating
  // around the app doesn't spam the browser's back-button history. ----
  useEffect(() => {
    const hash = view === "admin" ? `#/admin/${adminTab}` : `#/${view}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [view, adminTab]);

  // If a link/refresh lands on "#/admin/..." but the session check above
  // finds no signed-in staff account, the existing "view === admin &&
  // !adminUser" branch below already falls back to the login screen — so
  // there's nothing extra to do here beyond not crashing on a stale tab.

  // Wholesale accounts are only needed for the admin dashboard, so fetch
  // them once staff signs in (avoids an unnecessary fetch for every visitor).
  useEffect(() => {
    if (adminUser) {
      setWholesaleLoading(true);
      api.fetchWholesaleAccounts().then(setWholesaleAccounts).finally(() => setWholesaleLoading(false));
    }
  }, [adminUser]);

  function addToCart(product, qty) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { product, qty }];
    });
  }

  function updateCartQty(productId, qty) {
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)));
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  // Cart resets when switching between retail/wholesale — pricing, minimums,
  // and presets differ between the two, so a mixed cart would be ambiguous.
  function handleSetMode(newMode) {
    if (newMode !== mode && cart.length > 0) {
      setCart([]);
    }
    setMode(newMode);
  }

  function handleStaffLogin(user) {
    setAdminUser(user);
    // Dashboard and Trends are owner-only (see Roadmap/README) — a staff
    // login landing there would just hit the "you don't have access"
    // tab, so send staff straight to a tab they can actually use instead.
    setAdminTab(user.role === "owner" ? "dashboard" : "inventory");
    setView("admin");
  }

  async function handleStaffLogout() {
    await api.clearSession();
    setAdminUser(null);
    setView("storefront");
  }

  function handleWholesaleLogin(account) {
    setWholesaleUser(account);
    setMode("wholesale");
    setView("storefront");
  }

  async function handleWholesaleLogout() {
    await api.clearSession();
    setWholesaleUser(null);
    setMode("retail");
  }

  // ---- product CRUD (admin) ----
  async function handleAddProduct(product) {
    const created = await api.addProduct(product);
    setProducts((prev) => [...prev, created]);
  }
  async function handleUpdateProduct(id, updates) {
    const updated = await api.updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }
  async function handleDeleteProduct(id) {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ---- wholesale account approval (owner only) ----
  async function handleApproveWholesale(id) {
    const updated = await api.setWholesaleStatus(id, "approved");
    setWholesaleAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }
  async function handleRejectWholesale(id) {
    const updated = await api.setWholesaleStatus(id, "rejected");
    setWholesaleAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }
  async function handleDeleteWholesale(id) {
    await api.deleteWholesaleAccount(id);
    setWholesaleAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <LanguageContext.Provider value={{ lang, t, dir }}>
      <div className="app-shell" dir={dir} data-lang={lang}>
        <style>{css}</style>
        <nav className="topnav">
          <div className="brand">
            <img src="/logo-mark.png" alt="" className="brand-mark" width={20} height={20} />
            {t("brand")}
          </div>
          <div className="nav-right">
            <div className="nav-switch">
              <button className={view === "storefront" ? "active" : ""} onClick={() => setView("storefront")}>
                <Store size={14} /> {t("navStorefront")}
              </button>
              <button className={view === "matcher" ? "active" : ""} onClick={() => setView("matcher")}>
                <Pipette size={14} /> {t("navMatcher")}
              </button>
              <button className={view === "wholesale-signup" ? "active" : ""} onClick={() => setView("wholesale-signup")}>
                <Building2 size={14} /> {t("navBecomeBuyer")}
              </button>
              <button className={view === "contact" ? "active" : ""} onClick={() => setView("contact")}>
                <MessageCircle size={14} /> {t("navContact")}
              </button>
              {adminUser && (
                <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>
                  <Package size={14} /> {t("navAdmin")}
                </button>
              )}
            </div>

            {wholesaleUser && (
              <div className="session-chip">
                <Building2 size={13} />
                <span>{wholesaleUser.businessName}</span>
                <button onClick={handleWholesaleLogout} title={t("signOut")}><X size={12} /></button>
              </div>
            )}

            {adminUser && (
              <div className="session-chip">
                <ShieldCheck size={13} />
                <span>{adminUser.name} · {t(adminUser.role === "owner" ? "roleOwner" : "roleStaff")}</span>
                <button onClick={handleStaffLogout} title={t("signOut")}><X size={12} /></button>
              </div>
            )}

            <div className="lang-switch">
              <button className="lang-current" onClick={() => setLangMenuOpen((o) => !o)}>
                <Globe size={14} /> {LANGUAGES[lang].nativeLabel}
              </button>
              {langMenuOpen && (
                <div className="lang-menu">
                  {Object.entries(LANGUAGES).map(([code, info]) => (
                    <button
                      key={code}
                      className={code === lang ? "active" : ""}
                      onClick={() => { setLang(code); setLangMenuOpen(false); }}
                      dir={info.dir}
                    >
                      {info.nativeLabel}
                      {code === "en" && <span className="lang-default-tag">default</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="cart-nav-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={16} />
              {cart.length > 0 && <span className="nav-dot">{cart.length}</span>}
            </button>
          </div>
        </nav>

        {view === "storefront" && (
          <Storefront
            products={products}
            mode={effectiveMode}
            setMode={handleSetMode}
            cart={cart}
            onAddToCart={addToCart}
            canToggleWholesale={canToggleWholesale}
            onWholesaleLoginClick={() => setView("wholesale-login")}
          />
        )}
        {view === "matcher" && (
          <SwatchMatcher products={products} mode={effectiveMode} onOpen={setMatcherOpenProduct} currentUser={adminUser} />
        )}
        {view === "wholesale-signup" && (
          <WholesaleRequestForm onSubmitted={() => {}} />
        )}
        {view === "wholesale-login" && (
          <WholesaleLogin
            onLogin={handleWholesaleLogin}
            onGoToRequest={() => setView("wholesale-signup")}
            onCancel={() => setView("storefront")}
          />
        )}
        {view === "staff-login" && (
          <StaffLogin onLogin={handleStaffLogin} onCancel={() => setView("storefront")} />
        )}
        {view === "contact" && <ContactSection />}
        {view === "admin" && adminUser && (
          <>
            <div className="admin-subnav">
              {isOwner && (
                <button className={adminTab === "dashboard" ? "active" : ""} onClick={() => setAdminTab("dashboard")}>
                  <Layers size={13} /> Dashboard
                </button>
              )}
              {isOwner && (
                <button className={adminTab === "trends" ? "active" : ""} onClick={() => setAdminTab("trends")}>
                  <TrendingUp size={13} /> Trends
                </button>
              )}
              <button className={adminTab === "inventory" ? "active" : ""} onClick={() => setAdminTab("inventory")}>
                <Package size={13} /> {t("inventory")}
              </button>
              <button className={adminTab === "record-sale" ? "active" : ""} onClick={() => setAdminTab("record-sale")}>
                <ShoppingCart size={13} /> Record Sale
              </button>
              <button className={adminTab === "log-request" ? "active" : ""} onClick={() => setAdminTab("log-request")}>
                <Camera size={13} /> Log Request
              </button>
              <button className={adminTab === "demand" ? "active" : ""} onClick={() => setAdminTab("demand")}>
                <Sparkles size={13} /> Demand
              </button>
              <button className={adminTab === "purchase-list" ? "active" : ""} onClick={() => setAdminTab("purchase-list")}>
                <Layers size={13} /> Purchase List
              </button>
              <button className={adminTab === "suppliers" ? "active" : ""} onClick={() => setAdminTab("suppliers")}>
                <MapPin size={13} /> Suppliers
              </button>
              <button className={adminTab === "market-mode" ? "active" : ""} onClick={() => setAdminTab("market-mode")}>
                <ShoppingCart size={13} /> Market Mode
              </button>
              <button className={adminTab === "wholesale" ? "active" : ""} onClick={() => setAdminTab("wholesale")}>
                <Building2 size={13} /> {t("wholesaleBuyersTab")}
                {canManageWholesaleAccounts && wholesaleAccounts.filter((a) => a.status === "pending").length > 0 && (
                  <span className="nav-dot">{wholesaleAccounts.filter((a) => a.status === "pending").length}</span>
                )}
              </button>
            </div>
            {adminTab === "dashboard" && (isOwner ? <Dashboard products={products} /> : <OwnerOnlyNotice />)}
            {adminTab === "trends" && (isOwner ? <Trends /> : <OwnerOnlyNotice />)}
            {adminTab === "inventory" && (
              <AdminPanel
                products={products}
                loading={productsLoading}
                onAdd={handleAddProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                // Staff can add new stock, but only the owner can edit or
                // delete an existing inventory item — also enforced at the
                // database level (see supabase/schema.sql), this is just
                // the UI half of it.
                canEdit={isOwner}
                canDelete={isOwner}
              />
            )}
            {adminTab === "record-sale" && (
              <RecordSaleForm
                products={products}
                currentUser={adminUser}
                onRecorded={() => api.fetchProducts().then(setProducts)}
              />
            )}
            {adminTab === "log-request" && (
              <CustomerRequestForm products={products} />
            )}
            {adminTab === "demand" && (
              <DemandIntelligence products={products} />
            )}
            {adminTab === "purchase-list" && (
              <PurchaseList products={products} />
            )}
            {adminTab === "suppliers" && (
              <SuppliersAdmin canManage={isOwner} />
            )}
            {adminTab === "market-mode" && (
              <MarketMode products={products} currentUser={adminUser} />
            )}
            {adminTab === "wholesale" && (
              <WholesaleAdmin
                accounts={wholesaleAccounts}
                loading={wholesaleLoading}
                canManage={canManageWholesaleAccounts}
                onApprove={handleApproveWholesale}
                onReject={handleRejectWholesale}
                onDelete={handleDeleteWholesale}
              />
            )}
          </>
        )}
        {view === "admin" && !adminUser && (
          <StaffLogin onLogin={handleStaffLogin} onCancel={() => setView("storefront")} />
        )}

        <ProductDrawer
          product={matcherOpenProduct}
          mode={effectiveMode}
          onClose={() => setMatcherOpenProduct(null)}
          onAddToCart={addToCart}
          cartQty={matcherOpenProduct ? cart.find((i) => i.product.id === matcherOpenProduct.id)?.qty : null}
        />

        {cartOpen && (
          <CartPanel
            cart={cart}
            mode={effectiveMode}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onClear={() => { setCart([]); setCartOpen(false); }}
            onClose={() => setCartOpen(false)}
          />
        )}

        {!adminUser && (
          <footer className="app-footer">
            <button className="staff-login-link" onClick={() => setView("staff-login")}>
              <ShieldCheck size={12} /> {t("staffLogin")}
            </button>
          </footer>
        )}
      </div>
    </LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const css = `
:root {
  --cotton: #EDE8DF;
  --cotton-deep: #E1DACB;
  --ink: #2B2620;
  --ink-soft: #6B6154;
  --thread: #A8412E;
  --thread-deep: #7E2F21;
  --line: #D8CFBE;
  --ok: #3E6B4B;
  --low: #B8792A;
  --out: #A8412E;
}

* { box-sizing: border-box; }

.app-shell {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--cotton);
  color: var(--ink);
  min-height: 100vh;
}

h1, h2, h3 { font-family: 'Fraunces', Georgia, serif; margin: 0; }

.mono, .sku, td.mono { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.82rem; color: var(--ink-soft); }

/* RTL support for Pashto and Dari — Perso-Arabic script needs its own font
   stack (Latin serif/mono fonts don't render these characters properly),
   and layout needs to flip so it reads naturally right-to-left. */
.app-shell[dir="rtl"] {
  font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif;
}
.app-shell[dir="rtl"] h1, .app-shell[dir="rtl"] h2, .app-shell[dir="rtl"] h3 {
  font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', Georgia, serif;
}
.app-shell[dir="rtl"] .eyebrow { letter-spacing: 0; }
.app-shell[dir="rtl"] .mono, .app-shell[dir="rtl"] .sku, .app-shell[dir="rtl"] td.mono {
  font-family: 'JetBrains Mono', 'Courier New', monospace; direction: ltr; unicode-bidi: embed; text-align: right;
}
.app-shell[dir="rtl"] .hero-strip { flex-direction: row-reverse; }
.app-shell[dir="rtl"] .hero-chip { margin-left: 0; margin-right: -8px; }
.app-shell[dir="rtl"] .drawer { animation: slideInRtl 0.2s ease; }
@keyframes slideInRtl { from { transform: translateX(-24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.app-shell[dir="rtl"] .drawer-backdrop { justify-content: flex-start; }
.app-shell[dir="rtl"] .drawer-close { right: auto; left: 16px; }
.app-shell[dir="rtl"] .match-arrow { transform: scaleX(-1); }
.app-shell[dir="rtl"] .price-block, .app-shell[dir="rtl"] .hex-text { direction: ltr; text-align: right; }

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: var(--thread-deep);
  font-weight: 600;
  margin: 0 0 6px 0;
}

/* NAV */
.topnav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 32px; border-bottom: 1px solid var(--line);
  background: var(--cotton); position: sticky; top: 0; z-index: 10;
  gap: 16px; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 10px; font-family: 'Fraunces', serif; font-size: 1.15rem; font-weight: 600; }
.app-shell[dir="rtl"] .brand { font-family: 'Noto Naskh Arabic', serif; }
.brand-mark { width: 20px; height: 20px; border-radius: 3px; display: inline-block; flex-shrink: 0; object-fit: contain; }
.nav-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.nav-switch { display: flex; gap: 4px; background: var(--cotton-deep); padding: 4px; border-radius: 10px; }
.nav-switch button, .mode-toggle button {
  display: flex; align-items: center; gap: 6px;
  border: none; background: transparent; padding: 8px 14px; border-radius: 7px;
  font-size: 0.85rem; font-weight: 500; color: var(--ink-soft); cursor: pointer;
}
.nav-switch button.active, .mode-toggle button.active { background: var(--ink); color: var(--cotton); }

/* LANGUAGE SWITCHER */
.lang-switch { position: relative; }
.lang-current {
  display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: white;
  padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; color: var(--ink); cursor: pointer;
}
.lang-menu {
  position: absolute; top: calc(100% + 6px); right: 0; background: white; border: 1px solid var(--line);
  border-radius: 10px; padding: 6px; box-shadow: 0 8px 24px rgba(43,38,32,0.12); z-index: 20; min-width: 150px;
}
.app-shell[dir="rtl"] .lang-menu { right: auto; left: 0; }
.lang-menu button {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left;
  border: none; background: transparent; padding: 9px 12px; border-radius: 7px; font-size: 0.88rem; cursor: pointer; color: var(--ink);
}
.lang-menu button:hover { background: var(--cotton); }
.lang-menu button.active { background: var(--cotton-deep); font-weight: 600; }
.lang-default-tag { font-size: 0.65rem; text-transform: uppercase; color: var(--ink-soft); font-weight: 400; }

/* HERO */
.hero { padding: 48px 32px 24px; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.hero-text h1 { font-size: 2.4rem; line-height: 1.1; margin-bottom: 10px; }
.hero-sub { color: var(--ink-soft); max-width: 460px; font-size: 0.95rem; line-height: 1.5; }
.hero-strip { display: flex; }
.hero-chip { width: 30px; height: 60px; margin-left: -8px; border-radius: 4px; border: 2px solid var(--cotton); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }

/* TOOLBAR */
.toolbar { display: flex; gap: 16px; padding: 0 32px 16px; flex-wrap: wrap; }
.search-box { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 8px; background: white; border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; }
.search-box input { border: none; outline: none; background: transparent; font-size: 0.9rem; width: 100%; color: var(--ink); }
.mode-toggle { display: flex; background: var(--cotton-deep); padding: 4px; border-radius: 10px; }

/* TYPE TABS */
.type-tabs { display: flex; gap: 8px; padding: 0 32px 20px; flex-wrap: wrap; }
.type-tabs button { border: 1px solid var(--line); background: white; padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; cursor: pointer; color: var(--ink-soft); }
.type-tabs button.active { background: var(--ink); color: var(--cotton); border-color: var(--ink); }

.wholesale-banner {
  margin: 0 32px 20px; background: #FBF0E4; border: 1px solid #E3A028;
  color: #7A5417; padding: 12px 16px; border-radius: 10px; font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
}

/* CHAPTERS / SWATCH GRID */
.chapter { padding: 0 32px 32px; }
.chapter-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
.chapter-head h3 { font-size: 1.3rem; }
.chapter-count { color: var(--ink-soft); font-size: 0.8rem; }

.swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
.swatch-tile {
  border: 1px solid var(--line); background: white; border-radius: 12px; overflow: hidden;
  cursor: pointer; text-align: left; padding: 0; transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.swatch-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(43,38,32,0.1); }
.swatch-color { display: block; height: 90px; }
.swatch-meta { display: flex; flex-direction: column; padding: 10px 12px 12px; gap: 2px; }
.swatch-name { font-weight: 600; font-size: 0.9rem; }
.swatch-sub { font-size: 0.75rem; color: var(--ink-soft); }
.swatch-price { font-size: 0.82rem; font-weight: 600; color: var(--thread-deep); margin-top: 4px; }

.empty-state { padding: 40px 32px; color: var(--ink-soft); }

/* STOCK BADGE */
.stock-badge { font-size: 0.72rem; font-weight: 600; padding: 3px 9px; border-radius: 12px; display: inline-block; }
.stock-ok { background: #E4EEE6; color: var(--ok); }
.stock-low { background: #FBEFDD; color: var(--low); }
.stock-out { background: #F7E4E0; color: var(--out); }

/* DRAWER */
.drawer-backdrop { position: fixed; inset: 0; background: rgba(43,38,32,0.45); display: flex; justify-content: flex-end; z-index: 100; }
.drawer { width: min(420px, 92vw); background: var(--cotton); height: 100%; overflow-y: auto; position: relative; animation: slideIn 0.2s ease; }
@keyframes slideIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.drawer-close { position: absolute; top: 16px; right: 16px; background: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; }
.drawer-hero { height: 220px; position: relative; }
.drawer-hero-texture { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 6px); }
.drawer-body { padding: 24px; }
.drawer-body h2 { font-size: 1.6rem; margin-bottom: 12px; }
.spec-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; font-size: 0.8rem; color: var(--ink-soft); }
.spec-row span { display: flex; align-items: center; gap: 5px; }
.price-block { margin: 18px 0; }
.price-big { font-family: 'Fraunces', serif; font-size: 2rem; }
.price-unit { font-size: 0.9rem; font-weight: 400; color: var(--ink-soft); }
.price-note { display: block; font-size: 0.78rem; color: var(--thread-deep); margin-top: 2px; }
.drawer-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.drawer-footnote { font-size: 0.75rem; color: var(--ink-soft); line-height: 1.4; }
.drawer-quick-order { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
.drawer-quick-label { font-size: 0.76rem; color: var(--ink-soft); }

.btn { border: none; border-radius: 9px; padding: 12px 18px; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary { background: var(--thread); color: white; }
.btn-primary:disabled { background: #C9BEB0; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid var(--line); color: var(--ink); }
.btn-danger { background: var(--out); color: white; }
.btn-danger:disabled { background: #D9AFA6; cursor: not-allowed; }

/* CONFIRM DIALOG — small centered modal, distinct from the sliding .drawer
   used for forms; deleting something should feel like a quick, deliberate
   yes/no, not a full form panel. */
.confirm-backdrop { position: fixed; inset: 0; background: rgba(43,38,32,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.confirm-card { background: var(--cotton); border-radius: 14px; padding: 22px; width: min(380px, 100%); box-shadow: 0 10px 40px rgba(0,0,0,0.25); animation: popIn 0.15s ease; }
@keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.confirm-card h3 { font-size: 1.15rem; margin-bottom: 8px; }
.confirm-card p { font-size: 0.88rem; color: var(--ink-soft); line-height: 1.45; margin: 0 0 18px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* PURCHASE LIST — manual fabric search typeahead */
.manual-suggestions { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-height: 280px; overflow-y: auto; z-index: 50; }
.manual-suggestion-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; cursor: pointer; font-size: 0.85rem; color: var(--ink); border-bottom: 1px solid var(--line); }
.manual-suggestion-item:last-child { border-bottom: none; }
.manual-suggestion-item:hover { background: var(--cotton); }
.manual-suggestion-item .table-swatch { flex-shrink: 0; }
.manual-suggestion-item span:nth-child(2) { flex: 1; }
.manual-suggestion-empty { padding: 12px; font-size: 0.82rem; color: var(--ink-soft); }

/* CART */
.cart-nav-btn {
  position: relative; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line); background: white; width: 38px; height: 38px;
  border-radius: 10px; cursor: pointer; color: var(--ink);
}
.cart-nav-btn .nav-dot { position: absolute; top: -6px; right: -6px; }
.app-shell[dir="rtl"] .cart-nav-btn .nav-dot { right: auto; left: -6px; }

/* LOADING */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.loading-state { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: 0.9rem; padding: 30px 0; }

/* CONTACT */
.contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 8px; }
.contact-card { background: white; border: 1px solid var(--line); border-radius: 14px; padding: 22px; }
.contact-icon { color: var(--thread-deep); margin-bottom: 10px; }
.contact-card h4 { font-size: 1rem; margin-bottom: 6px; }
.contact-sub { color: var(--ink-soft); font-size: 0.88rem; }
.contact-coords { font-size: 0.76rem; color: var(--ink-soft); margin-top: 4px; }
.contact-placeholder-note { font-size: 0.76rem; color: var(--ink-soft); font-style: italic; margin-top: 20px; }

/* AUTH */
.auth-card {
  background: white; border: 1px solid var(--line); border-radius: 16px; padding: 36px;
  max-width: 420px; margin: 20px auto; text-align: center;
}
.auth-icon { color: var(--thread-deep); margin-bottom: 10px; }
.auth-logo { width: 88px; height: auto; margin: 0 auto 14px; display: block; }
.auth-card h2 { margin-bottom: 6px; }
.auth-card .hero-sub { text-align: center; margin: 0 auto 20px; }
/* ---------------------------------------------------------------------
   FORM CONTROLS — one shared look for every text/number/date/password
   input, select, and textarea in the app, whether it's inside
   .form-drawer (Inventory/Suppliers), .auth-form (login screens), or
   just a plain <label> in .admin (Record Sale, Log Request, Market
   Mode) — several of those last ones had no styling at all before this
   and were falling back to the browser's bare default look, which is
   what actually read as "ugly": inconsistent sizing, no focus state, no
   breathing room between fields. This block is the fix, applied once
   instead of per-screen so nothing can be missed again.
   --------------------------------------------------------------------- */
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 14px;
}
label:last-child { margin-bottom: 0; }
.sale-line label, .form-row label { margin-bottom: 0; } /* side-by-side / inline contexts manage their own spacing via gap */

input[type="text"],
input[type="password"],
input[type="tel"],
input[type="email"],
input[type="number"],
input[type="date"],
input:not([type]),
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 13px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  font-size: 0.92rem;
  font-family: inherit;
  color: var(--ink);
  background: white;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
input[type="text"]:focus,
input[type="password"]:focus,
input[type="tel"]:focus,
input[type="email"]:focus,
input[type="number"]:focus,
input[type="date"]:focus,
input:not([type]):focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--thread);
  box-shadow: 0 0 0 3px rgba(168, 65, 46, 0.14);
}
input::placeholder, textarea::placeholder { color: var(--ink-soft); opacity: 0.65; }
input:disabled, select:disabled, textarea:disabled { background: var(--cotton); color: var(--ink-soft); cursor: not-allowed; }
textarea { resize: vertical; min-height: 84px; line-height: 1.5; }
select { cursor: pointer; }
input[type="checkbox"] { width: auto; height: 16px; accent-color: var(--thread); cursor: pointer; }
input[type="color"] { width: 100%; height: 44px; padding: 4px; cursor: pointer; }
input[type="file"] {
  width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1.5px dashed var(--line);
  border-radius: 9px; font-size: 0.85rem; color: var(--ink-soft); background: var(--cotton);
}

.matcher-hint { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--thread-deep); margin-top: 10px; }
.sale-line { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.sale-line select { flex: 1; min-width: 220px; }
.sale-line-warn { font-size: 0.75rem; color: var(--low); white-space: nowrap; }

.form-drawer { padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.form-drawer h2 { margin-bottom: 8px; }
.auth-form { display: flex; flex-direction: column; gap: 4px; text-align: left; }
.app-shell[dir="rtl"] .auth-form { text-align: right; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-bottom: 14px; }
@media (max-width: 520px) { .form-row { grid-template-columns: 1fr; gap: 14px; } }
.auth-error { color: var(--out); font-size: 0.82rem; background: #F7E4E0; padding: 8px 12px; border-radius: 8px; }
.auth-link { border: none; background: transparent; color: var(--thread-deep); font-weight: 600; cursor: pointer; padding: 0; font-size: inherit; text-decoration: underline; }

.session-chip {
  display: flex; align-items: center; gap: 6px; background: white; border: 1px solid var(--line);
  padding: 7px 10px 7px 12px; border-radius: 20px; font-size: 0.8rem; color: var(--ink); white-space: nowrap;
}
.session-chip button { border: none; background: var(--cotton-deep); border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-soft); flex-shrink: 0; }

.app-footer { padding: 24px 32px; display: flex; justify-content: center; }
.staff-login-link { display: flex; align-items: center; gap: 6px; border: none; background: transparent; color: var(--ink-soft); font-size: 0.76rem; cursor: pointer; opacity: 0.6; }
.staff-login-link:hover { opacity: 1; }

.wholesale-login-prompt {
  display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: white;
  padding: 10px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; color: var(--thread-deep); cursor: pointer;
}
.wholesale-login-note { font-size: 0.72rem; color: var(--ok); margin-bottom: 10px; }
.staff-no-permission { font-size: 0.78rem; color: var(--ink-soft); font-style: italic; background: var(--cotton); padding: 8px 10px; border-radius: 8px; }
.wholesale-approve-form { margin-top: 4px; }
.wholesale-approve-row { display: flex; gap: 8px; }
.wholesale-approve-row input { flex: 1; padding: 8px 10px; border: 1px solid var(--line); border-radius: 7px; font-size: 0.82rem; font-family: inherit; }

.cart-drawer { width: min(480px, 94vw); }
.cart-min-notice { font-size: 0.8rem; color: var(--thread-deep); background: #FBF0E4; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; }
.cart-lines { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
.cart-line { display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--line); border-radius: 12px; padding: 14px; background: white; }
.cart-line-swatch { width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0; }
.cart-line-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cart-line-name { font-weight: 600; font-size: 0.92rem; }
.cart-line-sub { font-size: 0.76rem; color: var(--ink-soft); }
.cart-line-warn { font-size: 0.74rem; color: var(--out); font-weight: 600; margin-top: 2px; }
.cart-line-qty { display: flex; flex-direction: column; gap: 6px; }
.qty-presets { display: flex; gap: 4px; align-items: center; }
.qty-presets button {
  border: 1px solid var(--line); background: var(--cotton); color: var(--ink-soft);
  font-size: 0.76rem; font-weight: 600; padding: 5px 9px; border-radius: 6px; cursor: pointer;
}
.qty-presets button.active { background: var(--ink); color: var(--cotton); border-color: var(--ink); }
.qty-custom { width: 52px; padding: 5px 6px; border: 1px solid var(--line); border-radius: 6px; font-size: 0.78rem; font-family: 'JetBrains Mono', monospace; text-align: center; }
.cart-line-remove { border: none; background: transparent; color: var(--ink-soft); cursor: pointer; padding: 4px; flex-shrink: 0; }
.cart-line-remove:hover { color: var(--out); }

.cart-total-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-top: 1px solid var(--line); margin-bottom: 16px; font-weight: 600; }
.cart-total-value { font-family: 'Fraunces', serif; font-size: 1.3rem; }

/* SWATCH MATCHER */
.matcher { padding: 28px 32px 60px; max-width: 920px; }
.matcher-intro h1 { font-size: 2rem; margin-bottom: 10px; }
.matcher-intro { margin-bottom: 24px; }

.matcher-input-card { background: white; border: 1px solid var(--line); border-radius: 14px; padding: 22px; margin-bottom: 20px; }
.matcher-target { display: flex; gap: 18px; align-items: flex-start; }
.target-preview { width: 84px; height: 84px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06); }
.target-icon { color: rgba(0,0,0,0.3); }
.target-controls { flex: 1; }
.mini-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--ink-soft); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.hex-input-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.color-picker { width: 40px; height: 40px; border: 1px solid var(--line); border-radius: 8px; padding: 2px; cursor: pointer; background: white; }
.hex-text { font-family: 'JetBrains Mono', monospace; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; width: 110px; font-size: 0.9rem; }
.btn-sm { padding: 9px 14px; font-size: 0.8rem; }
.matcher-uploaded-img { max-width: 200px; max-height: 140px; border-radius: 8px; margin-top: 16px; border: 1px solid var(--line); object-fit: cover; }
.stock-filter { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--ink-soft); margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); cursor: pointer; }

.best-match-banner { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; font-size: 0.9rem; border: 1px solid; }
.best-match-swatch { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }
.best-match-banner.match-exact, .best-match-banner.match-excellent { background: #E4EEE6; border-color: #B9D6BF; color: #2A4A34; }
.best-match-banner.match-good { background: #FBF0E4; border-color: #E9C98F; color: #7A5417; }
.best-match-banner.match-fair, .best-match-banner.match-poor { background: #F7E4E0; border-color: #E3B3A9; color: #7E2F21; }

.match-results { background: white; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.match-results-head {
  display: grid; grid-template-columns: 40px 1.6fr 110px 140px 90px 20px; gap: 12px; align-items: center;
  padding: 10px 18px; background: var(--cotton-deep); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft);
}
.match-row {
  display: grid; grid-template-columns: 40px 1.6fr 110px 140px 90px 20px; gap: 12px; align-items: center;
  width: 100%; text-align: left; border: none; background: white; border-top: 1px solid var(--line);
  padding: 12px 18px; cursor: pointer; font-family: inherit;
}
.match-row:hover { background: var(--cotton); }
.match-swatch { width: 32px; height: 32px; border-radius: 7px; }
.match-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.match-name { font-weight: 600; font-size: 0.9rem; }
.match-sub { font-size: 0.75rem; color: var(--ink-soft); font-family: 'JetBrains Mono', monospace; }
.match-score { display: flex; flex-direction: column; }
.match-pct { font-family: 'Fraunces', serif; font-size: 1.15rem; line-height: 1.1; }
.match-label { font-size: 0.7rem; }
.match-score.match-exact .match-pct, .match-score.match-excellent .match-pct { color: var(--ok); }
.match-score.match-good .match-pct { color: var(--low); }
.match-score.match-fair .match-pct, .match-score.match-poor .match-pct { color: var(--out); }
.match-score.match-exact .match-label, .match-score.match-excellent .match-label { color: var(--ok); }
.match-score.match-good .match-label { color: var(--low); }
.match-score.match-fair .match-label, .match-score.match-poor .match-label { color: var(--out); }
.match-price { font-size: 0.85rem; font-weight: 600; }
.match-arrow { color: var(--ink-soft); justify-self: end; }

@media (max-width: 720px) {
  .match-results-head { display: none; }
  .match-row { grid-template-columns: 36px 1fr 70px; grid-template-areas: "swatch info arrow" "swatch info arrow" "stock score price"; }
}

/* CAMERA CAPTURE */
.camera-backdrop { position: fixed; inset: 0; background: rgba(43,38,32,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.camera-modal { background: var(--cotton); border-radius: 16px; padding: 24px; max-width: 480px; width: 100%; position: relative; }
.camera-modal h3 { font-size: 1.3rem; margin-bottom: 6px; }
.camera-tip { font-size: 0.82rem; color: var(--ink-soft); margin-bottom: 16px; line-height: 1.4; }
.camera-viewport { position: relative; background: #000; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; }
.camera-video { width: 100%; height: 100%; object-fit: cover; }
.camera-guide-frame { position: absolute; inset: 15%; border: 2px dashed rgba(255,255,255,0.7); border-radius: 10px; pointer-events: none; }
.camera-brightness { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.camera-brightness.light-good { background: rgba(62,107,75,0.9); color: white; }
.camera-brightness.light-warn { background: rgba(184,121,42,0.9); color: white; }
.camera-brightness.light-bad { background: rgba(168,65,46,0.9); color: white; }
.camera-error { color: white; font-size: 0.85rem; padding: 20px; text-align: center; }
.camera-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: center; }

/* WHOLESALE REQUEST FORM */
.wholesale-form h4 { display: flex; align-items: center; gap: 7px; font-size: 0.95rem; margin-bottom: 12px; color: var(--ink); }
.wholesale-form > label { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--ink-soft); margin-bottom: 12px; }
.wholesale-form input { padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 0.9rem; font-family: inherit; color: var(--ink); background: white; }
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; opacity: 0.7; }
.geo-capture { background: var(--cotton); border-radius: 10px; padding: 14px; margin-top: 4px; }
.geo-confirmed { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: var(--ok); margin-top: 8px; font-family: 'JetBrains Mono', monospace; }
.geo-error { display: block; font-size: 0.78rem; color: var(--out); margin-top: 8px; }
.wholesale-confirm { background: white; border: 1px solid var(--line); border-radius: 14px; padding: 40px; text-align: center; max-width: 420px; margin: 40px auto; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--ok); }
.wholesale-confirm h2 { color: var(--ink); }
.wholesale-confirm p { color: var(--ink-soft); font-size: 0.9rem; line-height: 1.5; }

/* WHOLESALE ADMIN */
.admin-subnav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; background: var(--cotton-deep); padding: 4px; border-radius: 10px; width: fit-content; }
.admin-subnav button { display: flex; align-items: center; gap: 6px; border: none; background: transparent; padding: 8px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 500; color: var(--ink-soft); cursor: pointer; }
.admin-subnav button.active { background: var(--ink); color: var(--cotton); }
.nav-dot { background: var(--thread); color: white; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 10px; }

.section-title { font-size: 1rem; margin: 24px 0 12px; color: var(--ink-soft); }
.wholesale-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.wholesale-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
.wholesale-card.status-pending { border-left: 3px solid var(--low); }
.wholesale-card.status-approved { border-left: 3px solid var(--ok); }
.wholesale-card.status-rejected { border-left: 3px solid var(--out); opacity: 0.7; }
.wholesale-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.wholesale-card-top h4 { font-size: 1rem; }
.wholesale-owner { font-size: 0.8rem; color: var(--ink-soft); margin-top: 2px; }
.status-pill { display: flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 10px; flex-shrink: 0; }
.status-pill.status-pending { background: #FBF0E4; color: var(--low); }
.status-pill.status-approved { background: #E4EEE6; color: var(--ok); }
.status-pill.status-rejected { background: #F7E4E0; color: var(--out); }
.wholesale-address { display: flex; gap: 8px; font-size: 0.82rem; color: var(--ink); margin-bottom: 8px; }
.wholesale-address svg { flex-shrink: 0; margin-top: 3px; color: var(--ink-soft); }
.wholesale-address-sub { color: var(--ink-soft); font-size: 0.78rem; }
.map-link { display: inline-flex; align-items: center; gap: 3px; font-size: 0.78rem; color: var(--thread-deep); font-weight: 600; margin-top: 4px; text-decoration: none; }
.no-pin { font-size: 0.76rem; color: var(--out); font-style: italic; }
.wholesale-gst { font-size: 0.76rem; margin-bottom: 10px; }
.wholesale-actions { display: flex; gap: 8px; }

/* ADMIN */
.admin { padding: 28px 32px 60px; }
.admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 28px; }
.stat-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.78rem; color: var(--ink-soft); }
.stat-value { font-family: 'Fraunces', serif; font-size: 1.6rem; }
.stat-card.warn .stat-value { color: var(--low); }
.stat-card.danger .stat-value { color: var(--out); }

.admin-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }

/* Record Sale */
.sale-confirm { display: flex; align-items: center; gap: 6px; background: var(--ok); color: white; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; width: fit-content; }
.sale-total { display: flex; justify-content: flex-end; gap: 20px; margin-top: 14px; font-size: 0.9rem; color: var(--ink-soft); }
.sale-total-final { font-weight: 700; color: var(--ink); }
.icon-btn { border: none; background: transparent; color: var(--ink-soft); cursor: pointer; padding: 6px; border-radius: 6px; }
.icon-btn:hover { background: var(--cotton-deep); }
.form-error { color: var(--out); font-size: 0.82rem; margin-top: 8px; }

/* Demand Intelligence / customer requests */
.request-list { display: flex; flex-direction: column; gap: 12px; }
.request-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.request-row:last-child { border-bottom: none; }
.request-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--line); }
.request-thumb-empty { background: var(--cotton-deep); display: flex; align-items: center; justify-content: center; }
.request-details { display: flex; flex-direction: column; gap: 2px; flex: 1; font-size: 0.85rem; }
.request-actions { display: flex; gap: 6px; flex-shrink: 0; }

/* Market Mode */
.clickable-row { cursor: pointer; }
.clickable-row:hover { background: var(--cotton-deep); }
.status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; background: var(--cotton-deep); color: var(--ink-soft); }
.status-pill.purchased { background: var(--ok); color: white; }
.status-pill.partial { background: var(--low); color: white; }
.status-pill.unavailable { background: var(--out); color: white; }
.status-pill.open { background: var(--ok); color: white; }
.status-pill.closed { background: var(--cotton-deep); color: var(--ink-soft); }
.connection-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.connection-badge.offline { background: var(--out); color: white; }
.connection-badge.syncing { background: var(--low); color: white; }
.progress-summary { display: flex; flex-wrap: wrap; gap: 16px; background: var(--cotton-deep); padding: 14px 18px; border-radius: 10px; margin-bottom: 16px; font-size: 0.85rem; }
.progress-summary .ok { color: var(--ok); }
.progress-summary .warn { color: var(--low); }
.progress-summary .danger { color: var(--out); }
.collection-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.collection-chip { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 20px; font-size: 0.78rem; }
.collection-chip.covered { background: var(--ok); color: white; }
.collection-chip.missing { background: var(--cotton-deep); color: var(--ink-soft); }
.trip-notes-textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; font-family: inherit; font-size: 0.9rem; resize: vertical; }
.shopping-row { flex-wrap: wrap; }
.purchase-detail-form { display: flex; gap: 8px; width: 100%; margin-top: 8px; }
.purchase-detail-form input { flex: 1; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; }
.pending-tag { font-style: italic; }

/* AI fabric matching (Phase 6) */
.fabric-photo-field { display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px solid var(--line); margin-top: 4px; }
.fabric-photo-field label { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--ink-soft); }
.fabric-photo-preview { width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); }
.ai-match-control { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
.ai-status { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; }
.ai-status-on { color: var(--ok); font-weight: 600; }
.ai-status-off { color: var(--ink-soft); }

/* AI business insights (Phase 7) */
.insights-panel { background: var(--cotton-deep); border-radius: 12px; padding: 16px 18px; margin-bottom: 18px; }
.insights-panel.insights-empty { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: 0.85rem; }
.insights-header { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; }
.insights-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.insights-list li { font-size: 0.88rem; line-height: 1.4; padding-left: 18px; position: relative; }
.insights-list li::before { content: "•"; position: absolute; left: 4px; color: var(--thread); }

/* Trends (Phase 5) */
.history-notice { display: flex; align-items: flex-start; gap: 8px; background: var(--cotton-deep); color: var(--ink-soft); padding: 12px 16px; border-radius: 10px; margin-bottom: 18px; font-size: 0.82rem; line-height: 1.4; }
.season-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.date-range-picker { display: flex; gap: 16px; flex-wrap: wrap; }
.date-range-picker label { display: flex; flex-direction: column; gap: 5px; font-size: 0.78rem; font-weight: 600; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
.date-range-picker input[type="date"] { font-family: inherit; }
.two-col-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.season-card { display: flex; flex-direction: column; gap: 4px; padding: 14px; background: var(--cotton-deep); border-radius: 10px; }
.season-name { font-size: 0.78rem; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
.season-revenue { font-size: 1.1rem; font-weight: 700; color: var(--ink); }

/* Dashboard */
.dash-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.dim { color: var(--ink-soft); font-weight: 400; }
.ranked-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.ranked-list-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; gap: 12px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
.ranked-list-row:last-child { border-bottom: none; padding-bottom: 0; }
.mini-chart { display: flex; align-items: flex-end; gap: 6px; height: 140px; }
.mini-chart-bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px; }
.mini-chart-fill { width: 100%; background: var(--thread); border-radius: 3px 3px 0 0; min-height: 2px; }
.mini-chart-label { font-size: 0.6rem; color: var(--ink-soft); writing-mode: vertical-rl; text-orientation: mixed; }
@media (max-width: 720px) {
  .dash-columns { grid-template-columns: 1fr; }
  .mini-chart-label { display: none; }
}

.table-wrap { background: white; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
th { text-align: left; padding: 12px 14px; background: var(--cotton-deep); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); }
td { padding: 10px 14px; border-top: 1px solid var(--line); }
.table-swatch { display: inline-block; width: 22px; height: 22px; border-radius: 5px; }
.row-actions { display: flex; gap: 6px; }
.row-actions button { border: none; background: var(--cotton-deep); border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }


@media (max-width: 640px) {
  .hero, .toolbar, .type-tabs, .chapter, .admin { padding-left: 16px; padding-right: 16px; }
  .topnav { padding: 14px 16px; }
  .hero-text h1 { font-size: 1.8rem; }
}
`;
