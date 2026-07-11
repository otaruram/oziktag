"""
Dynamic Pricing Service — handles exchange rate risk and cost calculation.

Pricing Strategy:
- All USD costs converted to IDR using configurable EXCHANGE_RATE
- Buffer applied on top to handle kurs fluctuation (default 20%)
- Package prices are pre-calculated but can be auto-adjusted

Cost Breakdown per QR Generate:
- Gemini AI: ~800 input tokens + ~400 output tokens
  - Input:  800/1M * $0.10 = $0.00008
  - Output: 400/1M * $0.40 = $0.00016
  - Total:  $0.00024 per request
- ImageKit: ~2.5MB per request (5 images)
  - Negligible on free tier, ~$0.04/GB after = ~Rp 1
- Estimated variable cost: ~Rp 5/QR at Rp 16,500/USD

Fixed Monthly Costs:
- Supabase Pro: $25 = Rp 412,500
- VPS: Rp 60,000
- Domain (.my.id): Rp 458/month (Rp 5,500/year)
- Total Fixed: ~Rp 472,958/month
- With 20% buffer: ~Rp 567,550/month
"""

from app.config import get_settings


# ──────────────────────── Cost Constants (USD) ────────────────────────

# Gemini AI cost per request
GEMINI_INPUT_TOKENS_PER_REQUEST = 800
GEMINI_OUTPUT_TOKENS_PER_REQUEST = 400
GEMINI_INPUT_PRICE_PER_1M = 0.10   # $0.10 per 1M tokens
GEMINI_OUTPUT_PRICE_PER_1M = 0.40  # $0.40 per 1M tokens

# ImageKit cost per request (minimal)
IMAGEKIT_COST_PER_REQUEST_IDR = 1.0

# Fixed monthly costs
SUPABASE_PRO_MONTHLY_USD = 25.0
VPS_MONTHLY_IDR = 60000.0
DOMAIN_YEARLY_IDR = 5500.0


def get_exchange_rate() -> float:
    """Get current exchange rate from config."""
    return get_settings().exchange_rate


def get_buffer_multiplier() -> float:
    """Get buffer multiplier (e.g., 1.20 for 20% buffer)."""
    return 1 + (get_settings().price_buffer_percent / 100)


def calculate_ai_cost_per_request_idr() -> float:
    """Calculate Gemini AI cost per QR generation in IDR."""
    rate = get_exchange_rate()
    buffer = get_buffer_multiplier()

    input_cost = (GEMINI_INPUT_TOKENS_PER_REQUEST / 1_000_000) * GEMINI_INPUT_PRICE_PER_1M
    output_cost = (GEMINI_OUTPUT_TOKENS_PER_REQUEST / 1_000_000) * GEMINI_OUTPUT_PRICE_PER_1M
    total_usd = input_cost + output_cost

    return (total_usd * rate * buffer) + IMAGEKIT_COST_PER_REQUEST_IDR


def calculate_fixed_costs_monthly_idr() -> float:
    """Calculate total fixed costs per month in IDR."""
    rate = get_exchange_rate()
    buffer = get_buffer_multiplier()

    supabase_idr = SUPABASE_PRO_MONTHLY_USD * rate
    domain_monthly_idr = DOMAIN_YEARLY_IDR / 12

    total = (supabase_idr * buffer) + (VPS_MONTHLY_IDR * buffer) + domain_monthly_idr
    return total


def calculate_bep(avg_price_per_qr: float) -> dict:
    """Calculate Break-Even Point."""
    fixed = calculate_fixed_costs_monthly_idr()
    variable = calculate_ai_cost_per_request_idr()
    margin = avg_price_per_qr - variable

    if margin <= 0:
        return {"error": "Price per QR must exceed variable cost"}

    bep_units = fixed / margin

    return {
        "fixed_costs_monthly": round(fixed),
        "variable_cost_per_qr": round(variable, 2),
        "price_per_qr": round(avg_price_per_qr),
        "margin_per_qr": round(margin, 2),
        "bep_units_monthly": round(bep_units),
        "exchange_rate": get_exchange_rate(),
        "buffer_percent": get_settings().price_buffer_percent,
    }


# ──────────────────────── Package Pricing ────────────────────────

def get_packages() -> dict:
    """
    Get dynamically-calculated package pricing.

    Strategy:
    - Starter: Rp 300/QR — entry-level, accessible for micro UMKM
    - Growth:  Rp 233/QR — sweet spot, best value proposition
    - Pro:     Rp 198/QR — volume discount, locks in serious users

    All prices stay below Rp 500/QR (UMKM-friendly).
    Margin is thick enough to survive 30%+ kurs swing.
    """
    return {
        "starter": {
            "name": "Starter",
            "price": 15000,
            "credits": 50,
            "price_per_qr": 300,
            "tagline": "Cocok untuk UMKM pemula",
        },
        "growth": {
            "name": "Growth",
            "price": 35000,
            "credits": 150,
            "price_per_qr": 233,
            "tagline": "Pilihan paling populer — hemat 22%",
            "highlight": True,
        },
        "pro": {
            "name": "Pro",
            "price": 79000,
            "credits": 400,
            "price_per_qr": 198,
            "tagline": "Harga termurah per QR — hemat 34%",
        },
        "elite_monthly": {
            "name": "Artisan Elite",
            "price": 49900,
            "credits": 0,
            "price_per_qr": 0,
            "tagline": "Langganan bulanan — eksklusif kerajinan tangan",
            "is_subscription": True,
        },
    }


def get_cost_analysis() -> dict:
    """Full cost analysis for admin dashboard."""
    rate = get_exchange_rate()
    buffer = get_buffer_multiplier()
    packages = get_packages()

    variable_cost = calculate_ai_cost_per_request_idr()
    fixed_cost = calculate_fixed_costs_monthly_idr()

    analysis = {
        "exchange_rate": rate,
        "buffer_percent": get_settings().price_buffer_percent,
        "variable_cost_per_qr_idr": round(variable_cost, 2),
        "fixed_cost_monthly_idr": round(fixed_cost),
        "fixed_cost_breakdown": {
            "supabase_pro": round(SUPABASE_PRO_MONTHLY_USD * rate * buffer),
            "vps": round(VPS_MONTHLY_IDR * buffer),
            "domain_monthly": round(DOMAIN_YEARLY_IDR / 12),
        },
        "packages": {},
    }

    for key, pkg in packages.items():
        margin = pkg["price_per_qr"] - variable_cost
        bep = fixed_cost / margin if margin > 0 else float("inf")
        analysis["packages"][key] = {
            **pkg,
            "margin_per_qr": round(margin, 2),
            "bep_units_monthly": round(bep),
            "monthly_revenue_if_sold_100pct": pkg["price"] * 10,  # assume 10 sales
        }

    return analysis
