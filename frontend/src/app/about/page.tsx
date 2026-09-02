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
              پنجاب دی زراعت، نہری پانی تے{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-brand to-lime-300 bg-clip-text text-transparent">
                سیٹلائٹ ڈیجیٹل ٹوئن
              </span>
            </>
          ) : (
            <>
              Indus Basin Agriculture &{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-brand to-lime-300 bg-clip-text text-transparent">
                Satellite Digital Twin
              </span>
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-mist leading-relaxed">
          {isUrdu
            ? "ایگری ٹوئن اوپن سیٹلائٹ امیجری، موسمیاتی ڈیٹا تے وارابندی نہری باری دے شیڈول نوں جوڑ کے کساناں لئی ڈیزل دی بچت تے بہتر زرعی فیصلے کرن وچ مدد فراہم کردا اے۔"
            : "AgriTwin explores how open satellite observations, weather forecasts, and canal rotational schedules (Warabandi) can help Punjab farmers and agricultural extension officers manage water and crop health more effectively."}
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

      {/* ── Collaborative Development Team ─────────────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 border-ink/8 relative overflow-hidden">
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-brand">
            {isUrdu ? "ڈویلپمنٹ ٹیم" : "The Team"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            {isUrdu ? "ایگری ٹوئن ڈویلپرز" : "Built by Aliyan Adil & Muhammad Nizamudeen"}
          </h2>
          <p className="text-xs text-mist mt-1 max-w-xl mx-auto">
            {isUrdu
              ? "ایہہ ہک باہمی کولیبوریٹو ہیکاتھون پراجیکٹ اے جو پنجاب دی زراعت، نہری نظام تے مٹی دے ڈیٹا نوں ڈیجیٹل ٹوئن نال جوڑن لئی بنایا گیا اے۔"
              : "A collaborative project exploring practical digital twin tools for Pakistani agriculture, combining canal water management, weather tracking, and soil analytics."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Aliyan Adil */}
          <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5 flex flex-col justify-between hover:border-brand/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-brand font-bold text-lg ring-1 ring-brand/30">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Aliyan Adil</h3>
                    <p className="text-[11px] text-mist">Frontend & Android Developer</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-mist leading-relaxed mb-4">
                Specializes in Android development, Java, and modern web frontends. Focused on the user interface, interaction design, and client-side data flows in AgriTwin.
              </p>
            </div>

            <div className="pt-3 border-t border-ink/6 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                <span className="rounded-md border border-ink/8 bg-ink/[0.03] px-2 py-0.5 text-[10px] font-mono text-dim">
                  Android & Java
                </span>
                <span className="rounded-md border border-ink/8 bg-ink/[0.03] px-2 py-0.5 text-[10px] font-mono text-dim">
                  Next.js & UI
                </span>
              </div>
              <a
                href="https://github.com/aliyan212"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <span>GitHub</span>
                <Icon name="externalLink" size={10} />
              </a>
            </div>
          </div>

          {/* Muhammad Nizamudeen */}
          <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5 flex flex-col justify-between hover:border-sky-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 font-bold text-lg ring-1 ring-sky-400/30">
                    N
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Muhammad Nizamudeen</h3>
                    <p className="text-[11px] text-mist">Developer & Collaborator</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-mist leading-relaxed mb-4">
                Co-developer and engineering collaborator working on system logic, integration workflows, and data pipelines for the AgriTwin prototype.
              </p>
            </div>

            <div className="pt-3 border-t border-ink/6 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                <span className="rounded-md border border-ink/8 bg-ink/[0.03] px-2 py-0.5 text-[10px] font-mono text-dim">
                  Co-Developer
                </span>
                <span className="rounded-md border border-ink/8 bg-ink/[0.03] px-2 py-0.5 text-[10px] font-mono text-dim">
                  Engineering
                </span>
              </div>
              <a
                href="https://github.com/muhammadnazamuddeen-dot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:underline"
              >
                <span>GitHub</span>
                <Icon name="externalLink" size={10} />
              </a>
            </div>
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
