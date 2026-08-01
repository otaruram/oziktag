"""
Dynamic Pricing Service — handles exchange rate risk and cost calculation.

Pricing Strategy:
- All USD costs converted to IDR using configurable EXCHANGE_RATE
- Buffer applied on top to handle kurs fluctuation (default 25%)
- Package prices are pre-calculated but can be auto-adjusted

Cost Breakdown per QR Generate:
- Gemini Flash Lite: ~1500 input tokens + ~500 output tokens
  - Input:  1500/1M * $0.025 = $0.0000375
  - Output: 500/1M  * $1.50  = $0.00075
  - Total:  ~$0.0008 per request
- Backup Claude Haiku 4.5: ~$0.0027 per request (fallback only)
- ImageKit: ~2.5MB per request — covered under Pro plan
- Estimated variable cost: ~Rp 14/QR at Rp 17,000/USD

Payment Gateway Fee: 0.7% + Rp 300 per transaction

Fixed Monthly Costs:
- Supabase Pro: Rp 550,000
- ImageKit Pro: Rp 200,000
- VPS Cloudeka: Rp 95,000
- Domain (.my.id): Rp 15,000/year = Rp 1,250/month
- Total Fixed: ~Rp 846,250/month
- With 25% buffer: ~Rp 1,057,813/month
"""

from app.config import get_settings


# ──────────────────────── Cost Constants ────────────────────────

# Primary LLM: Gemini Flash Lite (USD)
GEMINI_INPUT_TOKENS_PER_REQUEST = 1500
GEMINI_OUTPUT_TOKENS_PER_REQUEST = 500
GEMINI_INPUT_PRICE_PER_1M = 0.025    # $0.025 per 1M input tokens
GEMINI_OUTPUT_PRICE_PER_1M = 1.50    # $1.50 per 1M output tokens

# Backup LLM: Claude Haiku 4.5 (USD) — for reference only
CLAUDE_INPUT_PRICE_PER_1M = 0.10
CLAUDE_OUTPUT_PRICE_PER_1M = 5.00

# Fixed monthly costs (IDR)
SUPABASE_PRO_MONTHLY_IDR = 550_000.0
IMAGEKIT_PRO_MONTHLY_IDR = 200_000.0
VPS_CLOUDEKA_MONTHLY_IDR = 95_000.0
DOMAIN_YEARLY_IDR = 15_000.0

# Payment Gateway Fee
GATEWAY_FEE_PERCENT = 0.007   # 0.7%
GATEWAY_FEE_FLAT_IDR = 300.0  # Rp 300 per transaction


def get_exchange_rate() -> float:
    """Get current exchange rate from config."""
    return get_settings().exchange_rate


def get_buffer_multiplier() -> float:
    """Get buffer multiplier (e.g., 1.25 for 25% buffer)."""
    return 1 + (get_settings().price_buffer_percent / 100)


def calculate_ai_cost_per_request_idr() -> float:
    """Calculate Gemini Flash Lite AI cost per QR generation in IDR."""
    rate = get_exchange_rate()
    buffer = get_buffer_multiplier()

    input_cost = (GEMINI_INPUT_TOKENS_PER_REQUEST / 1_000_000) * GEMINI_INPUT_PRICE_PER_1M
    output_cost = (GEMINI_OUTPUT_TOKENS_PER_REQUEST / 1_000_000) * GEMINI_OUTPUT_PRICE_PER_1M
    total_usd = input_cost + output_cost

    return total_usd * rate * buffer


def calculate_gateway_fee(price: int) -> float:
    """Calculate payment gateway fee for a given price."""
    return (price * GATEWAY_FEE_PERCENT) + GATEWAY_FEE_FLAT_IDR


def calculate_fixed_costs_monthly_idr() -> float:
    """Calculate total fixed costs per month in IDR."""
    buffer = get_buffer_multiplier()
    domain_monthly = DOMAIN_YEARLY_IDR / 12

    total = (
        (SUPABASE_PRO_MONTHLY_IDR * buffer)
        + (IMAGEKIT_PRO_MONTHLY_IDR * buffer)
        + (VPS_CLOUDEKA_MONTHLY_IDR * buffer)
        + domain_monthly
    )
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
            "supabase_pro": round(SUPABASE_PRO_MONTHLY_IDR * buffer),
            "imagekit_pro": round(IMAGEKIT_PRO_MONTHLY_IDR * buffer),
            "vps_cloudeka": round(VPS_CLOUDEKA_MONTHLY_IDR * buffer),
            "domain_monthly": round(DOMAIN_YEARLY_IDR / 12),
        },
        "gateway_fee": {
            "percent": f"{GATEWAY_FEE_PERCENT * 100}%",
            "flat_idr": GATEWAY_FEE_FLAT_IDR,
        },
        "packages": {},
    }

    for key, pkg in packages.items():
        if pkg.get("is_subscription"):
            gateway_fee = calculate_gateway_fee(pkg["price"])
            analysis["packages"][key] = {
                **pkg,
                "gateway_fee": round(gateway_fee),
                "net_revenue": round(pkg["price"] - gateway_fee),
            }
        else:
            margin = pkg["price_per_qr"] - variable_cost
            gateway_fee = calculate_gateway_fee(pkg["price"])
            bep = fixed_cost / margin if margin > 0 else float("inf")
            analysis["packages"][key] = {
                **pkg,
                "margin_per_qr": round(margin, 2),
                "gateway_fee": round(gateway_fee),
                "net_revenue": round(pkg["price"] - gateway_fee),
                "bep_units_monthly": round(bep),
            }

    return analysis
