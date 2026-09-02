"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";

export default function AboutPage() {
  const { isUrdu } = useLanguage();

  const docsUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "/docs")
      : "http://127.0.0.1:8000/docs";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-12">
      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-medium text-brand">
          <Icon name="sprout" size={13} />
          <span>{isUrdu ? "پنجاب ڈیجیٹل ٹوئن زرعی پلیٹ فارم" : "Punjab Precision Digital Twin Engine"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
          {isUrdu ? (
            <>
              خلائی سیٹلائٹ ڈیٹا تے انڈس بیسن واٹر مینجمنٹ دا{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-brand to-lime-300 bg-clip-text text-transparent">
                انقلابی امتزاج
              </span>
            </>
          ) : (
            <>
              Space-Age Telemetry Meets{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-brand to-lime-300 bg-clip-text text-transparent">
                Indus Basin Agriculture
              </span>
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-mist leading-relaxed">
          {isUrdu
            ? "ایگری ٹوئن پنجاب دے کساناں تے محکمہ زراعت لئی تیار کیتا گیا ہک جدید ڈیجیٹل ٹوئن اے جو وارابندی نہری پانی دی تقسیم، ڈیزل ٹیوب ویل دے اخراجات دی بچت، سیٹلائٹ این ڈی وی آئی تے مٹی دی طبعی خصوصیات نوں یکجا کردا اے۔"
            : "AgriTwin is Pakistan’s first satellite-ground digital twin platform, translating real-time Earth observation, soil physics, and canal rotational rights into money-saving decisions for farmers and agronomists."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-abyss shadow-md hover:shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <Icon name="activity" size={15} />
            <span>{isUrdu ? "کنٹرول سینٹر کھولیں" : "Launch Mission Control"}</span>
          </Link>
          <Link
            href="/farms"
            className="rounded-xl border border-ink/10 bg-ink/5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink hover:bg-ink/10 transition-all flex items-center gap-2 active:scale-95"
          >
            <Icon name="wheat" size={15} />
            <span>{isUrdu ? "فارمز ہب ویکھو" : "Explore Farms Hub"}</span>
          </Link>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-ink/10 bg-ink/5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-mist hover:text-ink hover:bg-ink/10 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>{isUrdu ? "اے پی آئی دستاویزی" : "Swagger API"}</span>
            <Icon name="externalLink" size={12} />
          </a>
        </div>
      </div>

      {/* ── The Real Crisis in Punjab Agriculture ──────────────────────────── */}
      <div>
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-brand">The Challenge</span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            {isUrdu ? "پنجاب دی زراعت نوں درپیش اصل مسائل" : "The Real Challenges Facing Punjab Farmers"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel p-6 border-ink/8 hover:border-brand/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-brand mb-4">
              <Icon name="droplet" size={20} />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">
              {isUrdu ? "وارابندی نہری پانی دی پابندی" : "Rigid Warabandi Water Turns"}
            </h3>
            <p className="text-xs text-mist leading-relaxed">
              {isUrdu
                ? "وارابندی دی ہفتہ وار باری دا شیڈول فکس ہندا اے۔ اگر کسان دی باری رات 2 وجے ہووے تے اوہنوں خبر نہ ہووے کہ بارش آن والی اے، تاں اوہ فضول وچ ڈیزل یا نہری پانی بہا دیندا اے۔"
                : "The Warabandi canal roster operates on fixed weekly schedules. Farmers frequently irrigate blindly without knowing that 25mm of monsoon or winter rain is inbound within 48 hours."}
            </p>
          </div>

          <div className="glass-panel p-6 border-ink/8 hover:border-amber-500/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 mb-4">
              <Icon name="thermometer" size={20} />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">
              {isUrdu ? "ڈیزل ٹیوب ویل دا بھاری خرچہ" : "Crippling Tubewell Fuel Costs"}
            </h3>
            <p className="text-xs text-mist leading-relaxed">
              {isUrdu
                ? "پنجاب وچ ڈیزل ٹیوب ویل 1,400 توں 2,000 روپے فی گھنٹہ تے چلدے نیں۔ ہک بار فضول ٹیوب ویل چلان نال کسان دا ہزاراں روپے دا نقصان ہو جاندا اے۔"
                : "Running a diesel tubewell costs PKR 1,400 to PKR 2,200 per hour. Pumping when the soil root zone is already at Field Capacity causes waterlogging and wastes significant capital."}
            </p>
          </div>

          <div className="glass-panel p-6 border-ink/8 hover:border-rose-500/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 mb-4">
              <Icon name="alert" size={20} />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">
              {isUrdu ? "موسمیاتی حدت تے ہیٹ اسٹریس" : "Terminal Heat Stress"}
            </h3>
            <p className="text-xs text-mist leading-relaxed">
              {isUrdu
                ? "گندم دے دانہ بھرائی دے مرحلے تے درجہ حرارت 32 ڈگری توں ودھ جاوے تاں فصل جھلس جاندی اے، جس نال پنجاب بھر وچ 20 توں 35 فیصد پیداوار دا نقصان ہندا اے۔"
                : "Sudden temperature spikes above 32°C during grain filling cause grain shriveling. Calendar-day farming fails to warn growers before irreversible yield loss occurs."}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 Scientific Engines in AgriTwin ─────────────────────────────────── */}
      <div>
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-brand">Deep Science</span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            {isUrdu ? "ایگری ٹوئن دے چار بنیادی سائنسی انجنز" : "The 4 Core Scientific Engines Inside AgriTwin"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Engine 1 */}
          <div className="glass-panel p-6 border-ink/8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-brand">
                  <Icon name="droplet" size={18} />
                </span>
                <h3 className="text-base font-bold text-ink">1. Warabandi & Rain-Hold Engine</h3>
              </div>
              <span className="hud-pill text-[10px] text-brand border-brand/30 bg-brand/10">Indus Basin First</span>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Auto-detects the farmer&apos;s canal command (e.g. Lower Bari Doab, Lower Chenab, Thal Canal) and counts down to their weekly turn.
              Integrates 7-day quantitative precipitation forecasts with root-zone soil balance to trigger a <strong>Rain-Hold Recommendation</strong>, saving thousands of rupees in diesel fuel.
            </p>
            <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-[11px] font-mono text-dim">
              Formula: Vol = 1000 × Area × Z_root × (θ_FC − θ_current)
            </div>
          </div>

          {/* Engine 2 */}
          <div className="glass-panel p-6 border-ink/8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <Icon name="soil" size={18} />
                </span>
                <h3 className="text-base font-bold text-ink">2. ISRIC SoilGrids 2.0 & Saxton-Rawls</h3>
              </div>
              <span className="hud-pill text-[10px] text-amber-400 border-amber-400/30 bg-amber-500/10">Pedotransfer</span>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Connects to ISRIC SoilGrids at 250m ground resolution. Applies Saxton-Rawls (2006) pedotransfer functions to compute Field Capacity (θ_FC), Permanent Wilting Point (θ_PWP), and Available Water Capacity (AWC). Automatically classifies authentic Punjabi soil taxonomy (*میرا / Silt Loam*, *چکنی میرا / Clay Loam*).
            </p>
            <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-[11px] font-mono text-dim">
              Taxonomy: میرا (Silt Loam) · چکنی میرا (Clay Loam) · ریتلی (Sandy)
            </div>
          </div>

          {/* Engine 3 */}
          <div className="glass-panel p-6 border-ink/8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                  <Icon name="thermometer" size={18} />
                </span>
                <h3 className="text-base font-bold text-ink">3. Thermal Phenology (GDD) Engine</h3>
              </div>
              <span className="hud-pill text-[10px] text-rose-400 border-rose-400/30 bg-rose-500/10">Heat Units</span>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Replaces unreliable calendar days with cultivar-specific accumulated thermal heat units: GDD = max(0, (T_max + T_min)/2 - T_base). Calibrated for Pakistani cultivars (Wheat T_base=4.5°C, Basmati Rice T_base=10.0°C, Cotton T_base=15.5°C). Dynamically flags <strong>Terminal Heat Stress</strong> during critical flowering and grain filling.
            </p>
            <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-[11px] font-mono text-dim">
              Thresholds: Wheat T_base=4.5°C · Rice T_base=10.0°C · Cotton T_base=15.5°C
            </div>
          </div>

          {/* Engine 4 */}
          <div className="glass-panel p-6 border-ink/8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                  <Icon name="satellite" size={18} />
                </span>
                <h3 className="text-base font-bold text-ink">4. NASA MODIS Satellite Telemetry</h3>
              </div>
              <span className="hud-pill text-[10px] text-sky-400 border-sky-400/30 bg-sky-500/10">250m Resolution</span>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Integrates real 8-day composite Normalized Difference Vegetation Index (NDVI) from NASA Earthdata MOD13Q1. Automatically tracks 90-day canopy vigor trends, chlorophyll density, and vegetative stress without requiring expensive on-field optical hardware.
            </p>
            <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-[11px] font-mono text-dim">
              Data: MOD13Q1 250m Surface Reflectance · 90-day Vigor Curve
            </div>
          </div>
        </div>
      </div>

      {/* ── Two Personas Architecture ───────────────────────────────────────── */}
      <div className="glass-panel p-8 border-ink/8">
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-brand">Role Architecture</span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            {isUrdu ? "دوہری کرداراں دا مربوط نظام" : "Dual-Persona Operational Architecture"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-brand">
                <Icon name="wheat" size={15} />
              </span>
              <h4 className="text-sm font-bold text-ink">🌱 Punjab Farmer Persona</h4>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Engineered for field landowners (*زمیندار*). Focuses on parcel-level decisions: next Warabandi canal turn countdown, tubewell diesel fuel savings, adding new crops, and monitoring field health in Punjabi.
            </p>
            <div className="text-[11px] font-mono text-brand">Demo: farmer@agritwin.pk / password123</div>
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Icon name="activity" size={15} />
              </span>
              <h4 className="text-sm font-bold text-ink">🏛️ Agri Extension Officer Persona</h4>
            </div>
            <p className="text-xs text-mist leading-relaxed">
              Engineered for the Directorate General of Agriculture Extension Punjab. Supervises multi-district twin nodes across Okara, Faisalabad, and Multan. Field deletion is locked with *[Owner Protected]* to ensure audit compliance.
            </p>
            <div className="text-[11px] font-mono text-sky-400">Demo: officer@agritwin.pk / password123</div>
          </div>
        </div>
      </div>

      {/* ── Footer / Mission Statement ─────────────────────────────────────── */}
      <div className="text-center space-y-3 pt-4 border-t border-ink/8">
        <p className="text-xs text-mist font-mono">
          AgriTwin AI · Built for Pakistan Precision Agriculture · Open Source & Hackathon Ready
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-dim">
          <Link href="/" className="hover:text-ink transition-colors">Mission Control</Link>
          <span>·</span>
          <Link href="/farms" className="hover:text-ink transition-colors">Farms Hub</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-ink transition-colors">Sign In</Link>
          <span>·</span>
          <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">Swagger API</a>
        </div>
      </div>
    </div>
  );
}
