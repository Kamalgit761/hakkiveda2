"""Generate brand images via Gemini 2.5 Flash Image and update MongoDB products."""
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

API_KEY = os.environ["GOOGLE_API_KEY"]
OUT = ROOT / "static" / "generated"
OUT.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-2.5-flash-image-preview"

BRAND_STYLE = "luxury Ayurvedic brand HAKKIVEDA, premium minimal aesthetic, forest green and warm gold palette, ivory background, hyper-realistic, studio lighting, editorial photography."

IMAGES = [
    ("logo.png", f"Elegant minimalist luxury monogram logo for HAKKIVEDA — a premium Ayurvedic brand inspired by the Hakki Pikki tribe. Centred design: a single stylised herbal leaf in deep forest green (#0F5B3A) with a small gold (#C9A227) seed at its base, enclosed within a thin gold circle. The wordmark 'HAKKIVEDA' appears in refined modern serif lettering below in deep forest green, with the small tagline 'TRIBAL · AYURVEDA' underneath in tiny uppercase tracking. Pure ivory background (#FAF8F3). Vector-style, ultra-clean, no other elements, no shadows."),
    ("hero.png", f"Wide cinematic photograph: a single premium amber-glass apothecary bottle with a gold cap and ivory label resting on a moss-covered ancient stone deep within a sunlit Indian rainforest. Rays of soft golden morning light filter through the canopy of old-growth trees, illuminating fresh medicinal herbs, neem leaves, and bhringraj scattered around the bottle. Mystical, painterly, depth of field, dewdrops, photorealistic. {BRAND_STYLE}"),
    ("p_hair_oil_500.png", f"Premium 500ml amber glass apothecary bottle with a brushed gold metal cap and a handmade textured ivory paper label that reads 'HAKKIVEDA · Adivasi Herbal Hair Oil'. Bottle stands on a smooth cream marble surface surrounded by fresh bhringraj leaves, amla berries, and dried hibiscus petals. Soft natural sunlight, gold dust accents. {BRAND_STYLE}"),
    ("p_hair_oil_250.png", f"Smaller premium 250ml amber glass dropper bottle with a glass pipette and gold collar, ivory label reading 'HAKKIVEDA · Adivasi Herbal Hair Oil 250ml'. Resting on a cream marble surface, surrounded by amla and curry leaves. {BRAND_STYLE}"),
    ("p_shampoo.png", f"Tall 200ml elegant frosted-emerald glass bottle with a gold pump dispenser, label reading 'HAKKIVEDA · Adivasi 30 Herb Shampoo'. Cream marble surface with fresh shikakai pods, reetha berries, and hibiscus flowers around the base. {BRAND_STYLE}"),
    ("p_pain_oil.png", f"Compact 100ml amber glass bottle with a deep-green textured label reading 'HAKKIVEDA · Adivasi Pain Killer Oil'. Resting on a wooden chopping board surrounded by fresh ginger root, eucalyptus leaves and clove. Warm afternoon lighting. {BRAND_STYLE}"),
    ("p_beard_oil.png", f"Slender 50ml amber glass bottle with a black-and-gold dropper cap, masculine kraft-paper label reading 'HAKKIVEDA · Beard Growth Oil'. Resting on a dark walnut wood surface with a vintage barber's comb and cedarwood shavings nearby. Moody warm lighting. {BRAND_STYLE}"),
    ("p_tan_cream.png", f"Round ceramic jar (100g) with a screw-on gold lid and an ivory label reading 'HAKKIVEDA · Tan & Pigmentation Cream'. Resting on cream marble surrounded by saffron strands, sandalwood pieces and a small bowl of turmeric. Soft pastel lighting. {BRAND_STYLE}"),
    ("p_whitening_soap.png", f"Handcrafted creamy ivory soap bar (100g) embossed with the HAKKIVEDA leaf logo, wrapped partially in a textured kraft paper sleeve labelled 'Tan Removal & Whitening Soap'. Resting on a cream marble surface with sandalwood, papaya slices and milk droplets. Soft morning light. {BRAND_STYLE}"),
    ("p_antimark_cream.png", f"Tiny 10g porcelain pot with a brushed gold screw cap and minimalist label reading 'HAKKIVEDA · Anti-Mark Ayurvedic Cream'. Resting on cream marble surrounded by rose petals and a sprig of manjistha. Soft diffused light. {BRAND_STYLE}"),
    ("p_bodywash.png", f"Tall 250ml frosted glass bottle with a charcoal-grey gradient and a slim gold pump, ivory label reading 'HAKKIVEDA · Body Wash · Skin Whitening & Tan Removal'. Resting in a spa-like bathroom scene with cream marble, dried lavender, and a single papaya slice. {BRAND_STYLE}"),
]

SLUG_MAP = {
    "p_hair_oil_500.png": "adivasi-herbal-hair-oil-500ml",
    "p_hair_oil_250.png": "adivasi-herbal-hair-oil-250ml",
    "p_shampoo.png": "adivasi-30-herb-shampoo",
    "p_pain_oil.png": "adivasi-pain-killer-oil",
    "p_beard_oil.png": "beard-growth-oil",
    "p_tan_cream.png": "tan-pigmentation-removal-cream",
    "p_whitening_soap.png": "tan-removal-whitening-soap",
    "p_antimark_cream.png": "anti-mark-ayurvedic-cream",
    "p_bodywash.png": "body-wash-skin-whitening",
}


client = genai.Client(api_key=API_KEY)


async def gen(filename: str, prompt: str):
    if (OUT / filename).exists():
        print(f"  skip (exists): {filename}")
        return True
    full_prompt = (
        "You are an expert luxury brand photographer and designer.\n\n" + prompt
    )
    try:
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=full_prompt,
            config=genai_types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        image_bytes = None
        for cand in (response.candidates or []):
            for part in (cand.content.parts or []):
                inline = getattr(part, "inline_data", None)
                if inline and inline.data:
                    image_bytes = inline.data
                    break
            if image_bytes:
                break
        if not image_bytes:
            print(f"  FAIL (no image): {filename}")
            return False
        (OUT / filename).write_bytes(image_bytes)
        print(f"  ok: {filename} ({len(image_bytes)//1024}kb)")
        return True
    except Exception as e:
        print(f"  ERROR {filename}: {e}")
        return False


async def update_db():
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = mongo[os.environ["DB_NAME"]]
    for fname, slug in SLUG_MAP.items():
        if not (OUT / fname).exists():
            continue
        url = f"/api/static/generated/{fname}"
        await db.products.update_one({"slug": slug}, {"$set": {"images": [url], "ai_image": True}})
        print(f"  db: {slug} -> {url}")
    mongo.close()


async def main():
    print("Generating images...")
    for fname, prompt in IMAGES:
        await gen(fname, prompt)
    print("\nUpdating MongoDB...")
    await update_db()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
