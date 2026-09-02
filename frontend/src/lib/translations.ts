export type Language = "en" | "ur";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // ── Navigation & System ──
    brandName: "AgriTwin AI",
    brandTagline: "Punjab Precision Agriculture Platform",
    navDashboard: "Mission Control",
    navFarmsHub: "Farms Operations Hub",
    navAbout: "About Platform",
    navDocs: "API Docs",
    nodeLive: "Punjab Node Live",
    apiOffline: "API Offline",
    connecting: "Connecting…",
    signIn: "Sign In",
    signOut: "Sign Out",
    welcomeFarmer: "Welcome, Farmer",

    // ── Dashboard Command Bar & Overview ──
    headerTitle: "Punjab Agricultural Operations & Precision Diagnostics",
    headerSubtitle: "Unified digital twin integrating Open-Meteo telemetry, MODIS 250m vegetation index, ERA5 soil physics, and AgriCore AI reasoning.",
    missionControl: "Mission Control",
    farmControlCenter: "Farm Control Center",
    selectFarm: "Select Farm",
    activeFarm: "Active Farm",
    totalFarms: "Total Farms",
    monitoredArea: "Monitored Area",
    activeDistricts: "Active Districts",
    liveSync: "Live Sync",
    healthScore: "Health Score",
    satelliteNdvi: "Satellite NDVI",
    acres: "acres",
    hectares: "ha",
    centroid: "Centroid",
    fieldArea: "Field Area",
    dataStatus: "Data Status",

    // ── Farm Selector ──
    searchFarmPlaceholder: "Search farm name or district…",
    noFarmsMatch: "No farms match your search.",
    selectOrDraw: "Select an existing farm or draw a new boundary on the map.",
    drawNewFarmOnMap: "Draw New Farm on Map",
    switchFarm: "Switch Farm",

    // ── Map & Boundary Drawing ──
    drawFarm: "Draw Farm Boundary",
    drawInstruction: "Click points on the satellite map to enclose your field boundary.",
    finishDrawing: "Click first point or double click to close polygon",
    registerFarm: "Register Farm Boundary",
    farmName: "Farm Name",
    farmNamePlaceholder: "e.g. Chak 45 South Field",
    district: "District (Punjab)",
    districtPlaceholder: "e.g. Faisalabad, Multan, Bahawalpur, Okara",
    saveFarm: "Save Farm",
    cancel: "Cancel",
    autoDetected: "Auto-detected from boundary centroid",
    fieldBoundary: "Field Boundary",

    // ── Health Score Dimensions ──
    cropHealthTitle: "Field Health Index",
    agriCoreEngine: "AgriCore Engine",
    optimalCondition: "Optimal Condition",
    moderateStress: "Moderate Stress",
    highRisk: "High Risk",
    criticalAlert: "Critical Alert",
    vegHealth: "Vegetation & Canopy (NDVI)",
    waterSoil: "Soil Water & Moisture",
    weatherStress: "Weather Comfort",
    pestRisk: "Pest & Disease Safety",
    climateAnomaly: "Climate Normal Stability",

    // ── Weather & Agrometeorology ──
    currentWeather: "Agrometeorology & Soil Physics",
    weatherUnavailable: "Weather Feed Unavailable",
    noFarmSelected: "No Farm Selected",
    chooseFarmPrompt: "Choose a farm from the header to view live weather and soil conditions.",
    temperature: "Temperature",
    humidity: "Relative Humidity",
    rainfall: "Precipitation Rate",
    rainAccumulation: "Past hour accumulation",
    rainProb: "Rain Probability",
    windSpeed: "10m Wind Velocity",
    windSpraySafety: "Spray drift safety",
    soilMoisture: "Root Soil Moisture",
    soilMoistureSubtext: "0–7 cm topsoil layer",
    soilTemp: "Surface Soil Temp",
    soilTempSubtext: "Root microbial zone",
    et0: "Reference ET₀",
    et0Subtext: "Daily crop water demand",
    airQuality: "Air Quality (PM2.5)",
    goodAir: "Good Air",
    moderateSmog: "Moderate Smog",
    unhealthySmog: "Unhealthy Smog",
    severeSmog: "Severe Smog Hazard",

    // ── Forecast ──
    forecast7Day: "7-Day Agronomic Weather Forecast",
    forecastSubtext: "Open-Meteo High-Resolution Punjab Grid",
    maxTemp: "Max Temp",
    minTemp: "Min Temp",
    rainExpected: "Rain Expected",
    evapoDemand: "Evapo Demand",

    // ── Crop Management & Phenology ──
    cropLifecycle: "Crop Lifecycle & Phenology",
    activeCrop: "Active Crop",
    addCrop: "Add Crop",
    growthStage: "Growth Stage",
    sowingDate: "Sowing Date",
    daysAfterSowing: "days after sowing",
    cropVariety: "Crop Variety",
    activeCroppingCycle: "Active cropping cycle",
    knowledgeBaseStage: "Knowledge Base Growth Stage",
    stagePhase: "Phase",
    seasonRabi: "Rabi (Winter)",
    seasonKharif: "Kharif (Summer)",
    selectCropName: "Select Crop",
    selectSeason: "Select Season",
    enterSowingDate: "Sowing Date (Optional)",
    saveCrop: "Save Crop Cycle",

    // Stages
    stageGermination: "Germination",
    stageTillering: "Tillering",
    stageJointing: "Jointing",
    stageBooting: "Booting",
    stageFlowering: "Flowering",
    stageGrainFilling: "Grain Filling",
    stageMaturity: "Maturity",
    stageHarvest: "Harvest Ready",

    // ── Satellite NDVI ──
    modisSatelliteNdvi: "MODIS Satellite NDVI",
    ndviSubtext: "Terra 250m 16-Day Vegetative Health Composite",
    healthyRange: "Healthy Range",
    currentNdvi: "Current NDVI",
    ndviChange: "Change vs Previous",
    ndviImproving: "Improving Canopy",
    ndviDeclining: "Declining Greenness",
    ndviStable: "Stable Biomass",

    // ── AI Copilot & Recommendations ──
    aiCopilot: "AI Diagnostic Reasoning & Copilot",
    generateRec: "Generate AI Recommendation",
    synthesizingRec: "Synthesizing AI Reasoning…",
    recommendationLabel: "Recommended Action Plan",
    reasoningLabel: "Diagnostic Evidence & Reasoning",
    confidence: "Model Confidence",
    riskLevel: "Risk Level",
    riskLow: "Low Risk",
    riskModerate: "Moderate Risk",
    riskHigh: "High Risk",
    riskCritical: "Critical Risk",
    copy: "Copy",
    copied: "Copied",
    groundedInTelemetry: "Grounded in Live Field Data & ML Forecast",
    langToggleEn: "English",
    langToggleUr: "پنجابی",

    // ── Alerts ──
    activeAlerts: "Active Field Alerts & Early Warnings",
    noActiveAlerts: "No Active Agronomic Alerts",
    noAlertsSubtext: "All telemetry parameters are currently within normal thresholds.",
    severityInfo: "Notice",
    severityWarning: "Warning",
    severityCritical: "Critical",
    alertAction: "Recommended Action",
    alertEvidence: "Observed Evidence",

    // ── Climate Normal ──
    climateCardTitle: "30-Year Climate Anomaly",
    climateSubtext: "NASA POWER MERRA-2 Historical Reanalysis",
    historicalMeanTemp: "Historical Mean Temp",
    tempAnomaly: "Thermal Deviation",
    historicalPrecip: "Historical Precipitation",
    humidityAnomaly: "Moisture Deviation",
    warmerThanNormal: "Warmer than 30-year baseline",
    coolerThanNormal: "Cooler than 30-year baseline",

    // ── ML Score Forecast ──
    mlForecastTitle: "7-Day Health Score Forecast",
    mlForecastSubtext: "Locally-Trained Random Forest Regression Model",
    predictedScore: "Predicted Score",
    featureImportances: "Key Factor Influences",

    // ── Data Feeds & Provenance ──
    integratedFeeds: "Integrated Data Feeds & System Provenance",
    weatherSource: "Open-Meteo · Ground Telemetry & Soil Physics",
    nasaSource: "NASA POWER · 30-Year MERRA-2 Climate Baseline",
    modisSource: "MODIS Terra · 250m 16-Day NDVI Vegetation",
    agriCoreSource: "AgriCore · Multi-Vector Health Engine & ML",
    cropKnowledgeSource: "Punjab Agriculture · Phenological Growth Tables",

    // ── Farms Hub ──
    hubTitle: "Farms Operations Hub",
    hubSubtitle: "Centralized registry of digital twin nodes across Punjab agricultural zones.",
    registerNewFarm: "Register / Draw New Farm",
    searchPlaceholder: "Filter by farm name, district, province…",
    allDistricts: "All Districts",
    viewAnalytics: "Intelligence",
    viewHistory: "History",
    deleteFarmNode: "Delete Farm Node",
    noFarmsFound: "No farms found",
    noFarmsFoundSubtext: "No farms match your search criteria. Try resetting your filters.",
    noFarmsRegistered: "No farms registered yet. Open the map to draw your first field boundary.",

    // ── History Page ──
    historyTitle: "Field Observation History",
    historySubtitle: "Chronological log of sensor observations, satellite NDVI, and AI health scores.",
    backToIntelligence: "Back to Intelligence",
    dateTimestamp: "Timestamp",
    tempReading: "Temperature",
    humidityReading: "Humidity",
    rainReading: "Rainfall",
    soilReading: "Soil Moisture",
    scoreReading: "Health Score",
    noHistoryRecords: "No historical records logged yet.",

    // ── Confirmation Modal ──
    confirmDeleteTitle: "Delete Agricultural Farm Node",
    confirmDeleteMsg: "Are you sure you want to delete this farm? This action will permanently remove all associated crop records, telemetry history, satellite observations, and AI diagnostic models.",
    confirmBtn: "Delete Farm Node",
    cancelBtn: "Keep Farm",
  },
  ur: {
    // ── Navigation & System (Clear Punjab Shahmukhi / Punjabi-Urdu) ──
    brandName: "ایگری ٹوئن (AgriTwin)",
    brandTagline: "پنجاب ڈیجیٹل فارمنگ تے زرعی پلیٹ فارم",
    navDashboard: "مین ڈیش بورڈ",
    navFarmsHub: "فارم کنٹرول ہب",
    navAbout: "پلیٹ فارم تعارف",
    navDocs: "اے پی آئی دستاویزات",
    nodeLive: "پنجاب نیٹ ورک لائیو",
    apiOffline: "نیٹ ورک بند اے",
    connecting: "رابطہ ہو رہیا اے…",
    signIn: "لاگ ان کرو",
    signOut: "لاگ آؤٹ",
    welcomeFarmer: "خوش آمدید، کسان ویر",

    // ── Dashboard Command Bar & Overview ──
    headerTitle: "پنجاب زرعی نگرانی تے خودکار تشخیصی نظام",
    headerSubtitle: "موسمیاتی ڈیٹا، سیٹلائٹ امیجری، زمین دی نمی تے مصنوعی ذہانت نال تیار کیتی گئی جدید ترین زرعی رہنمائی۔",
    missionControl: "کنٹرول سینٹر",
    farmControlCenter: "فارم کنٹرول سینٹر",
    selectFarm: "فارم منتخب کرو",
    activeFarm: "زیرِ نگرانی فارم",
    totalFarms: "کل فارمز",
    monitoredArea: "زیرِ نگرانی رقبہ",
    activeDistricts: "فعال اضلاع",
    liveSync: "لائیو رابطہ",
    healthScore: "صحت دا اسکور",
    satelliteNdvi: "سیٹلائٹ این ڈی وی آئی",
    acres: "ایکڑ",
    hectares: "ہیکٹر",
    centroid: "مرکزی مقام (کوآرڈینیٹس)",
    fieldArea: "کھیت دا رقبہ",
    dataStatus: "ڈیٹا دی صورتحال",

    // ── Farm Selector ──
    searchFarmPlaceholder: "فارم دا ناں یا ضلع تلاش کرو…",
    noFarmsMatch: "تلاش دے مطابق کوئی فارم نہیں ملیا۔",
    selectOrDraw: "کوئی موجودہ فارم چنو یا نقشے تے نویں فارم دی حد بندی بناؤ۔",
    drawNewFarmOnMap: "نقشے تے نواں فارم بناؤ",
    switchFarm: "فارم بدلو",

    // ── Map & Boundary Drawing ──
    drawFarm: "فارم دی حد بندی کرو",
    drawInstruction: "نقشے تے نشان لگا کے اپنے کھیت دی حد بندی بناؤ۔",
    finishDrawing: "حد بندی مکمل کرن لئی پہلے نشان تے کلک کرو",
    registerFarm: "نواں فارم رجسٹر کرو",
    farmName: "فارم دا ناں",
    farmNamePlaceholder: "مثلاً: چک 45 جنوبی کھیت",
    district: "ضلع (پنجاب)",
    districtPlaceholder: "مثلاً: فیصل آباد، ملتان، بہاولپور، اوکاڑہ",
    saveFarm: "فارم محفوظ کرو",
    cancel: "منسوخ کرو",
    autoDetected: "مقام توں ضلع خودکار معلوم ہو گیا",
    fieldBoundary: "کھیت دی حد بندی",

    // ── Health Score Dimensions ──
    cropHealthTitle: "فصل دی مجموعی صحت انڈیکس",
    agriCoreEngine: "ایگری کور انجن",
    optimalCondition: "بہترین حالت",
    moderateStress: "ہلکا دباؤ",
    highRisk: "زیادہ خطرہ",
    criticalAlert: "انتہائی فوری توجہ",
    vegHealth: "فصل دی ہریالی (سیٹلائٹ)",
    waterSoil: "پانی تے زمین دی نمی",
    weatherStress: "موسمی دباؤ",
    pestRisk: "کیڑیاں (سنڈی/تیلہ) دا خطرہ",
    climateAnomaly: "موسمیاتی تبدیلی دا فرق",

    // ── Weather & Agrometeorology ──
    currentWeather: "موجودہ موسم تے زمین دی صورتحال",
    weatherUnavailable: "موسمی ڈیٹا دستیاب نہیں",
    noFarmSelected: "کوئی فارم منتخب نہیں کیتا گیا",
    chooseFarmPrompt: "لائیو موسم تے زمین دی نمی ویکھن لئی اوپر توں کوئی فارم چنو۔",
    temperature: "درجہ حرارت",
    humidity: "ہوا وچ نمی",
    rainfall: "بارش دی مقدار",
    rainAccumulation: "پچھلے گھنٹے دی بارش",
    rainProb: "بارش دا امکان",
    windSpeed: "ہوا دی رفتار",
    windSpraySafety: "سپرے لئی ہوا دی جانچ",
    soilMoisture: "زمین دی نمی (0-7 سینٹی میٹر)",
    soilMoistureSubtext: "جڑاں دی سطح وچ نمی",
    soilTemp: "زمین دا درجہ حرارت",
    soilTempSubtext: "جڑاں دی اندرونی گرمی",
    et0: "پانی دا اخراج (ET₀)",
    et0Subtext: "روزانہ پانی دی طلب",
    airQuality: "ہوا دا معیار (PM2.5)",
    goodAir: "صاف ہوا",
    moderateSmog: "ہلکی سموگ",
    unhealthySmog: "نقصان دہ سموگ",
    severeSmog: "شدید خطرناک سموگ",

    // ── Forecast ──
    forecast7Day: "اگلے 7 دن دا زرعی موسمی جائزہ",
    forecastSubtext: "اوپن میٹیو ہائی ریزولیوشن پنجاب گرڈ",
    maxTemp: "زیادہ توں زیادہ",
    minTemp: "گھٹ توں گھٹ",
    rainExpected: "متوقع بارش",
    evapoDemand: "پانی دا اخراج",

    // ── Crop Management & Phenology ──
    cropLifecycle: "فصل دے مراحل تے عمر",
    activeCrop: "کاشت شدہ فصل",
    addCrop: "فصل شامل کرو",
    growthStage: "موجودہ مرحلہ",
    sowingDate: "بیجائی دی تاریخ",
    daysAfterSowing: "دن بیجائی توں بعد",
    cropVariety: "فصل دی قسم",
    activeCroppingCycle: "جاری فصلی دورانیہ",
    knowledgeBaseStage: "زرعی ماہرین دے مطابق مرحلہ",
    stagePhase: "مرحلہ",
    seasonRabi: "ربیع (ہاڑی)",
    seasonKharif: "خریف (ساؤنی)",
    selectCropName: "فصل چنو",
    selectSeason: "موسمی سیزن چنو",
    enterSowingDate: "بیجائی دی تاریخ (اختیاری)",
    saveCrop: "فصل محفوظ کرو",

    // Stages
    stageGermination: "اگاؤ / بیج اکھاڑنا",
    stageTillering: "شگوفے / پھوٹ",
    stageJointing: "گنڈھ بننا / گانٹھ",
    stageBooting: "گوپھ / گوبھ",
    stageFlowering: "بور / پھل آنا",
    stageGrainFilling: "دانہ بھرائی / دودھیا حالت",
    stageMaturity: "پکائی / تیار",
    stageHarvest: "کٹائی لئی تیار",

    // ── Satellite NDVI ──
    modisSatelliteNdvi: "موڈس سیٹلائٹ ہریالی انڈیکس (NDVI)",
    ndviSubtext: "ٹیرا سیٹلائٹ 250 میٹر 16 روزہ فصلی تصویری ریکارڈ",
    healthyRange: "صحت مند ہریالی دی حد",
    currentNdvi: "موجودہ این ڈی وی آئی",
    ndviChange: "پچھلی تصویر نال موازنہ",
    ndviImproving: "ہریالی ودھ رہی اے",
    ndviDeclining: "ہریالی گھٹ رہی اے",
    ndviStable: "فصل تسلی بخش اے",

    // ── AI Copilot & Recommendations ──
    aiCopilot: "مصنوعی ذہانت دی زرعی رہنمائی",
    generateRec: "زرعی مشورہ تیار کرو",
    synthesizingRec: "زرعی رپورٹ تیار ہو رہی اے…",
    recommendationLabel: "کسان ویر لئی عملی مشورہ",
    reasoningLabel: "سائنسی تے موسمی وجہ",
    confidence: "اعتماد دا تناسب",
    riskLevel: "خطرے دی نوعیت",
    riskLow: "گھٹ خطرہ",
    riskModerate: "درمیانہ خطرہ",
    riskHigh: "زیادہ خطرہ",
    riskCritical: "انتہائی نازک صورتحال",
    copy: "کاپی کرو",
    copied: "کاپی ہو گیا",
    groundedInTelemetry: "لائیو فیلڈ ڈیٹا تے مشین لرننگ ماڈل",
    langToggleEn: "English",
    langToggleUr: "پنجابی",

    // ── Alerts ──
    activeAlerts: "فیلڈ الرٹس تے فوری موسمی انتباہ",
    noActiveAlerts: "کوئی فوری خطرہ یا الرٹ نہیں",
    noAlertsSubtext: "تمام موسمی تے زمینی اشاریے فی الحال محفوظ حد وچ نیں۔",
    severityInfo: "اطلاع",
    severityWarning: "انتباہ",
    severityCritical: "فوری کارروائی",
    alertAction: "ضروری اقدام",
    alertEvidence: "سامنے آن والے شواہد",

    // ── Climate Normal ──
    climateCardTitle: "30 سالہ موسمیاتی موازنہ",
    climateSubtext: "ناسا پاور پچھلے 30 سالہ تاریخی ریکارڈ دا تجزیہ",
    historicalMeanTemp: "تاریخی اوسط درجہ حرارت",
    tempAnomaly: "درجہ حرارت وچ فرق",
    historicalPrecip: "تاریخی اوسط بارش",
    humidityAnomaly: "نمی دا فرق",
    warmerThanNormal: "عام سالاں نالوں زیادہ گرم",
    coolerThanNormal: "عام سالاں نالوں زیادہ ٹھنڈا",

    // ── ML Score Forecast ──
    mlForecastTitle: "اگلے 7 دن دا صحت اسکور تخمینہ (ML)",
    mlForecastSubtext: "مقامی فارم ڈیٹا تے ٹرینڈ کیتا گیا رینڈم فارسٹ ماڈل",
    predictedScore: "متوقع صحت اسکور",
    featureImportances: "اہم اثر انداز عوامل",

    // ── Data Feeds & Provenance ──
    integratedFeeds: "منسلک ڈیٹا فیڈز تے نظام دا ماخذ",
    weatherSource: "اوپن میٹیو · زمینی موسم تے مٹی دی طبعی حالت",
    nasaSource: "ناسا پاور · 30 سالہ موسمیاتی اوسط",
    modisSource: "موڈس ٹیرا · 250 میٹر این ڈی وی آئی ہریالی امیجری",
    agriCoreSource: "ایگری کور · کثیر جہتی صحت ماڈل تے مشین لرننگ",
    cropKnowledgeSource: "محکمہ زراعت پنجاب · فصلی مراحل دا کیلنڈر",

    // ── Farms Hub ──
    hubTitle: "فارمز آپریشنز ہب",
    hubSubtitle: "پنجاب بھر دے رجسٹرڈ فارمز تے ڈیجیٹل ٹوئن نوڈز دا مکمل ریکارڈ۔",
    registerNewFarm: "نواں فارم شامل کرو",
    searchPlaceholder: "فارم دا ناں، ضلع یا علاقہ تلاش کرو…",
    allDistricts: "تمام اضلاع",
    viewAnalytics: "تفصیلی تجزیہ",
    viewHistory: "تاریخچہ",
    deleteFarmNode: "فارم ڈیلیٹ کرو",
    noFarmsFound: "کوئی فارم نہیں ملیا",
    noFarmsFoundSubtext: "تلاش دے مطابق کوئی فارم نہیں ملیا۔ فلٹر ری سیٹ کرو۔",
    noFarmsRegistered: "کوئی فارم رجسٹرڈ نہیں۔ نقشے تے کلک کر کے اپنے کھیت دی حد بندی بناؤ۔",

    // ── History Page ──
    historyTitle: "فارم دا تاریخی ریکارڈ",
    historySubtitle: "موسمی سینسرز، سیٹلائٹ این ڈی وی آئی تے اے آئی اسکورز دا مکمل تاریخچہ۔",
    backToIntelligence: "واپس لائیو تجزیہ تے جاؤ",
    dateTimestamp: "وقت / تاریخ",
    tempReading: "درجہ حرارت",
    humidityReading: "نمی",
    rainReading: "بارش",
    soilReading: "زمین دی نمی",
    scoreReading: "صحت اسکور",
    noHistoryRecords: "فی الحال کوئی پرانا ریکارڈ موجود نہیں۔",

    // ── Confirmation Modal ──
    confirmDeleteTitle: "زرعی فارم ڈیلیٹ کرو",
    confirmDeleteMsg: "کی تسی واقعی اس فارم نوں ختم کرنا چاہندے ہو؟ ایہ عمل واپس نہیں ہو سکدا تے تمام سیٹلائٹ، فصلی تے تشخیصی ریکارڈ ختم ہو جائے گا۔",
    confirmBtn: "فارم حذف کرو",
    cancelBtn: "فارم محفوظ رکھو",
  },
};

export const stageTranslationMap: Record<string, { en: string; ur: string }> = {
  // Wheat & Cereals
  germination: { en: "Germination", ur: "اگاؤ (بیج اکھاڑنا)" },
  tillering: { en: "Tillering", ur: "شگوفے (پھوٹ / ترنجاں)" },
  jointing: { en: "Jointing", ur: "گنڈھ بننا (گانٹھاں)" },
  booting: { en: "Booting", ur: "گوپھ (گوبھ مرحلہ)" },
  flowering: { en: "Flowering", ur: "بور (پھل / پھل آنا)" },
  anthesis: { en: "Anthesis", ur: "بور آنا (پھل کھلنا)" },
  "grain filling": { en: "Grain Filling", ur: "دانہ بھرائی (دودھیا حالت)" },
  "milk stage": { en: "Milk Stage", ur: "دودھیا حالت" },
  "dough stage": { en: "Dough Stage", ur: "دانہ پکنا (سخت ہونا)" },
  maturity: { en: "Maturity", ur: "پکائی (تیار فصل)" },
  maturation: { en: "Maturation", ur: "پکائی مرحلہ" },
  harvest: { en: "Harvest", ur: "کٹائی لئی تیار" },
  "harvest ready": { en: "Harvest Ready", ur: "کٹائی لئی تیار" },

  // Rice
  nursery: { en: "Nursery", ur: "پنیری (پود تیار کرنا)" },
  transplanting: { en: "Transplanting", ur: "پنیری لانا (منتقلی)" },
  "panicle initiation": { en: "Panicle Initiation", ur: "سِٹا بننا (سٹا آغاز)" },
  heading: { en: "Heading", ur: "سِٹا نکلنا (سٹا باہر آنا)" },

  // Cotton
  seedling: { en: "Seedling", ur: "چھوٹا پودا (گڈائی)" },
  squaring: { en: "Squaring", ur: "ڈوڈیاں بننا (ڈوڈی مرحلہ)" },
  "boll formation": { en: "Boll Formation", ur: "ٹینڈے بننا" },
  "boll opening": { en: "Boll Opening", ur: "ٹینڈے کھڑنا (چنائی تیار)" },

  // Sugarcane
  "grand growth": { en: "Grand Growth", ur: "تیز بڑھوتری (وادھا)" },

  // Maize
  vegetative: { en: "Vegetative", ur: "شاخاں تے پتے (وادھا)" },
  "vegetative growth": { en: "Vegetative Growth", ur: "نباتاتی وادھا" },
  tasseling: { en: "Tasseling", ur: "جھنڈا سِٹا (ٹیسلنگ)" },
  silking: { en: "Silking", ur: "ریشم نکلنا (سلکنگ)" },

  // General & Legumes
  emergence: { en: "Emergence", ur: "اگاؤ" },
  ripening: { en: "Ripening", ur: "پکائی" },
  branching: { en: "Branching", ur: "شاخاں کڈھنا" },
  "pod formation": { en: "Pod Formation", ur: "پھلیاں بننا" },
  "fruit set": { en: "Fruit Set", ur: "پھل لگنا" },
  "crown root initiation": { en: "Crown Root Initiation", ur: "تاجی جڑاں بننا (CRI)" },
  cri: { en: "CRI", ur: "تاجی جڑاں (CRI)" },
  sowing: { en: "Sowing", ur: "بیجائی" },
  active: { en: "Active", ur: "فعال فصل" },
};

export const cropNameTranslationMap: Record<string, { en: string; ur: string }> = {
  wheat: { en: "Wheat", ur: "گندم (کنک)" },
  "rice (basmati)": { en: "Rice (Basmati)", ur: "دھان (باسمتی چاول)" },
  rice: { en: "Rice", ur: "دھان (چاول)" },
  cotton: { en: "Cotton", ur: "کپاس (پھٹی)" },
  sugarcane: { en: "Sugarcane", ur: "کماد (گنا)" },
  maize: { en: "Maize", ur: "مکئی (چھلی)" },
  gram: { en: "Gram / Chickpea", ur: "چھولے (چنا)" },
  chickpea: { en: "Chickpea", ur: "چھولے (چنا)" },
  mustard: { en: "Mustard", ur: "سرسوں / رایا" },
  potato: { en: "Potato", ur: "آلو" },
  sunflower: { en: "Sunflower", ur: "سورج مکھی" },
};

export function getLocalizedCropName(name: string, isUrdu: boolean): string {
  if (!name) return "";
  if (!isUrdu) return name;
  const key = name.toLowerCase().trim();
  if (cropNameTranslationMap[key]) return cropNameTranslationMap[key].ur;
  for (const [k, v] of Object.entries(cropNameTranslationMap)) {
    if (key.includes(k) || k.includes(key)) return v.ur;
  }
  return name;
}

export function getLocalizedStageName(name: string, isUrdu: boolean): string {
  if (!name) return "";
  if (!isUrdu) return name;
  const key = name.toLowerCase().trim();
  if (stageTranslationMap[key]) return stageTranslationMap[key].ur;
  for (const [k, v] of Object.entries(stageTranslationMap)) {
    if (key.includes(k) || k.includes(key)) return v.ur;
  }
  return name;
}
