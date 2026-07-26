import os
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from bson.errors import InvalidId

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets

# ========== MODELOS ==========
class Product(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    original_price: float
    discount_price: float
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool
    created_at: datetime

class ProductCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    original_price: float
    discount_price: float
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool
    created_at: datetime

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None

class Offer(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: bool

class OfferCreate(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: bool

class OfferUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: Optional[bool] = None

class AdminLoginRequest(BaseModel):
    password: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class ForgotPasswordRequest(BaseModel):
    email: str

# ========== CONFIGURACIÓN ==========
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()

MONGO_URL = os.getenv("MONGO_URL", "tu_cadena_de_conexion_aqui")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Caza-Ofertas2026")

client = AsyncIOMotorClient(MONGO_URL)
db = client.cazaofertas

# ========== HELPER ANTI-ERRORES DE ID ==========
def get_query_id(item_id: str):
    try:
        return {"$or": [{"id": item_id}, {"_id": ObjectId(item_id)}]}
    except InvalidId:
        return {"id": item_id}

# ========== RUTAS PÚBLICAS ==========
@api_router.get("/products")
async def get_products():
    cursor = db.products.find({"active": True})
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    return products

@api_router.get("/offers")
async def get_offers(type: Optional[str] = None):
    query = {"active": True}
    if type:
        query["type"] = type
    cursor = db.offers.find(query)
    offers = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        offers.append(doc)
    return offers

@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    return {"reply": "¡Hola! He recibido tu mensaje de Caza Ofertas, pero el cerebro de IA aún está en construcción. ¡Regresa pronto!"}

# ========== RUTAS DE RECUPERACIÓN DE CONTRASEÑA ==========
@api_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    email = request.email

    reset_token = secrets.token_hex(32)
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/?v={reset_token}"

    sender_email = os.getenv('EMAIL_USER', 'tu_correo@gmail.com')
    sender_password = os.getenv('EMAIL_PASS', 'tu_contraseña_de_aplicacion')

    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #FFEA00; background-color: #000; padding: 10px; border-radius: 8px;">CazaOfertasML</h1>
        </div>
        <h2>Hola Omar Navarro,</h2>
        <p>Recientemente solicitaste restablecer la contraseña de tu cuenta CazaOfertasML. Haz clic en el botón de abajo para restablecerla. <strong>Este restablecimiento de contraseña solo es válido durante las próximas 24 horas.</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{reset_link}" style="background-color: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablece tu contraseña</a>
        </div>
        
        <p>Si tienes alguna pregunta sobre este correo, simplemente comunícate con nuestro equipo de soporte para obtener ayuda.</p>
        <p>Con cariño,<br>El tío CazaOfertasML.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">Si tiene problemas con el botón de arriba, copie y pegue la URL a continuación en su navegador web.</p>
        <a href="{reset_link}" style="font-size: 12px; color: #0056b3; word-break: break-all;">{reset_link}</a>
      </div>
    """

    message = MIMEMultipart("alternative")
    message["Subject"] = "Restablecimiento de Contraseña | CazaOfertasML"
    message["From"] = f"El tío CazaOfertasML <{sender_email}>"
    message["To"] = email
    message.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        return {"success": True, "message": "Correo enviado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo: {str(e)}")

# ========== RUTAS DE ADMINISTRACIÓN ==========
@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    if request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Autenticado correctamente"}
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")

@api_router.get("/admin/products")
async def get_admin_products(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.products.find({})
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    return products

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    prod_dict = product.model_dump()
    await db.products.insert_one(prod_dict)
    return {"success": True, "message": "Producto creado exitosamente"}

@api_router.patch("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    if 'original_price' in update_dict or 'discount_price' in update_dict:
        product = await db.products.find_one(get_query_id(product_id), {"_id": 0})
        if product:
            original = update_dict.get('original_price', product.get('original_price', 0))
            discount = update_dict.get('discount_price', product.get('discount_price', 0))
            if original > 0:
                update_dict['discount_percentage'] = int(((original - discount) / original) * 100)
    
    result = await db.products.update_one(get_query_id(product_id), {"$set": update_dict})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"success": True, "message": "Producto actualizado"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    result = await db.products.delete_one(get_query_id(product_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto eliminado"}

@api_router.get("/admin/offers")
async def get_admin_offers(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.offers.find({})
    offers = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        offers.append(doc)
    return offers

@api_router.post("/admin/offers")
async def create_offer(offer: OfferCreate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    offer_dict = offer.model_dump()
    await db.offers.insert_one(offer_dict)
    return {"success": True, "message": "Oferta creada exitosamente"}

@api_router.patch("/admin/offers/{offer_id}")
async def update_offer(offer_id: str, offer_data: OfferUpdate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in offer_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
    result = await db.offers.update_one(get_query_id(offer_id), {"$set": update_dict})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta actualizada"}

@api_router.delete("/admin/offers/{offer_id}")
async def delete_offer(offer_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
        
    result = await db.offers.delete_one(get_query_id(offer_id))
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta eliminada"}

app.include_router(api_router)
